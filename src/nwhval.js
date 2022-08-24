import { lang } from './_lang';
import { tmpl, findAncestor, groupedElemCount, mergeConfig, isFunction, insertAfter } from './_utils';

class Validator
{
    constructor(form, config)
    {
        this.defaultConfig = {
            classTo: 'form-group',
            errorClass: 'is-invalid',
            successClass: 'is-valid',
            errorTextParent: 'form-group',
            errorTextTag: 'div',
            live: true,
            errorTextClass: 'invalid-feedback',
            lang: 'en'
        }

        this.form = form;
        this.config = mergeConfig(config || {}, this.defaultConfig);

        this.NWHVAL_ERROR = 'nwhval-error';
        const SELECTOR = "input:not([type^=hidden]):not([type^=submit]), select, textarea";
        const ALLOWED_ATTRIBUTES = ["required", "min", "max", 'minlength', 'maxlength', 'pattern'];
        const EMAIL_REGEX = /^[a-zA-Z0-9.! #$%&'*+/=? ^_`{|}~-]+@[a-zA-Z0-9-]+(?:\. [a-zA-Z0-9-]+)*$/;
        const MESSAGE_REGEX = /-message(?:-([a-z]{2}(?:_[A-Z]{2})?))?/; // matches, -message, -message-en, -message-en_US
        this.validators = {};

        this._setValidator(
            'text',
            {
                fn: () => true, priority: 0
            },
            this.config.lang
        );

        this._setValidator(
            'required',
            {
                fn: function (val)
                {
                    return (this.type === 'radio' || this.type === 'checkbox') ? groupedElemCount(this) : val !== undefined && val !== ''
                }, priority: 99, halt: true
            },
            this.config.lang
        );

        this._setValidator(
            'email',
            {
                fn: (val) => !val || EMAIL_REGEX.test(val)
            },
            this.config.lang
        );

        this._setValidator(
            'number',
            {
                fn: (val) => !val || !isNaN(parseFloat(val)), priority: 2
            },
            this.config.lang
        );

        this._setValidator(
            'integer',
            {
                fn: (val) => !val || /^\d+$/.test(val)
            },
            this.config.lang
        );

        this._setValidator(
            'minlength',
            {
                fn: (val, length) => !val || val.length >= parseInt(length)
            },
            this.config.lang
        );

        this._setValidator(
            'maxlength',
            {
                fn: (val, length) => !val || val.length <= parseInt(length)
            },
            this.config.lang
        );

        this._setValidator(
            'min',
            {
                fn: function (val, limit) { return !val || (this.type === 'checkbox' ? groupedElemCount(this) >= parseInt(limit) : parseFloat(val) >= parseFloat(limit)); }
            },
            this.config.lang
        );

        this._setValidator(
            'max',
            {
                fn: function (val, limit) { return !val || (this.type === 'checkbox' ? groupedElemCount(this) <= parseInt(limit) : parseFloat(val) <= parseFloat(limit)); }
            },
            this.config.lang
        );

        this._setValidator(
            'pattern',
            {
                fn: (val, pattern) => { let m = pattern.match(new RegExp('^/(.*?)/([gimy]*)$')); return !val || (new RegExp(m[1], m[2])).test(val); }
            },
            this.config.lang
        );


        form.setAttribute("novalidate", "true");

        let self = this;
        const inputs = form.querySelectorAll(SELECTOR);

        this.fields = Array.from(inputs).map(function (input)
        {
            let fns = [];
            let params = {};
            let messages = {};

            [].forEach.call(input.attributes, function (attr)
            {
                if (/^data-pristine-/.test(attr.name))
                {
                    let name = attr.name.substr(14);
                    let messageMatch = name.match(MESSAGE_REGEX);
                    if (messageMatch !== null)
                    {
                        let locale = messageMatch[1] === undefined ? 'en' : messageMatch[1];
                        if (!messages.hasOwnProperty.call(locale))
                            messages[locale] = {};
                        messages[locale][name.slice(0, name.length - messageMatch[0].length)] = attr.value;
                        return;
                    }
                    if (name === 'type') name = attr.value;
                    self._addValidatorToField(fns, params, name, attr.value);
                } else if (~ALLOWED_ATTRIBUTES.indexOf(attr.name))
                {
                    self._addValidatorToField(fns, params, attr.name, attr.value);
                } else if (attr.name === 'type')
                {
                    self._addValidatorToField(fns, params, attr.value);
                }
            });

            fns.sort((a, b) => b.priority - a.priority);

            return input.pristine = { input, validators: fns, params, messages, self };

        }.bind(self));

        for (let i = 0; i < inputs.length; i++)
        {
            if (inputs[i].getAttribute('type') === 'radio' || inputs[i].getAttribute('type') === 'checkbox')
            {
                inputs[i].addEventListener('change', function (e)
                {
                    self.validate(e.target);
                });
            }
            else
            {
                inputs[i].addEventListener('input', function (e)
                {
                    self.validate(e.target);
                });
            }
        }

        // self.config.live && input.addEventListener((!~['radio', 'checkbox'].indexOf(input.getAttribute('type')) ? 'input' : 'change'), function (e)
        // {
        //     console.log(e.target);
        //     self.validate(e.target);
        // }.bind(self));
    }

    _setValidator(name, validator, locale)
    {
        validator.name = name;

        if (!validator.msg)
        {
            validator.msg = lang[locale][name];
        }

        if (validator.priority === undefined)
        {
            validator.priority = 1;
        }

        this.validators[name] = validator;
    }


    _addValidatorToField(fns, params, name, value)
    {
        let validator = this.validators[name];
        if (validator)
        {
            fns.push(validator);
            if (value)
            {
                let valueParams = value.split(',');
                valueParams.unshift(null); // placeholder for input's value
                params[name] = valueParams;
            }
        }
    }

    /***
     * Checks whether the form/input elements are valid
     * @param input => input element(s) or a jquery selector, null for full form validation
     * @param silent => do not show error messages, just return true/false
     * @returns {boolean} return true when valid false otherwise
     */
    validate(input, silent)
    {
        if (input === undefined)
        {
            silent = (input && silent === true) || input === true;

            let fields = this.fields;

            if (input !== true && input !== false)
            {
                if (input instanceof HTMLElement)
                {
                    fields = [input.pristine];
                } else if (input instanceof NodeList || input instanceof (window.$ || Array) || input instanceof Array)
                {
                    fields = Array.from(input).map(el => el.pristine);
                }
            }

            let valid = true;

            for (let i = 0; fields[i]; i++)
            {
                let field = fields[i];
                if (this._validateField(field))
                {
                    !silent && this._showSuccess(field);
                } else
                {
                    valid = false;
                    !silent && this._showError(field);
                }
            }
            return valid;
        }
        else if (
            input.nodeName === "INPUT"
            ||
            input.nodeName === "SELECT"
            ||
            input.nodeName === "TEXTAREA"
        )
        {
            let toValidate = this.fields.find(field => field.input === input);
            if (this._validateField(toValidate))
            {
                !silent && this._showSuccess(toValidate);
            }
            else
            {
                !silent && this._showError(toValidate);
            }
        }

        // console.log("Validating: " + input.getAttribute("name") + " silent: " + silent);



    }

    /***
     * Get errors of a specific field or the whole form
     * @param input
     * @returns {Array|*}
     */
    getErrors(input)
    {
        if (!input)
        {
            let erroneousFields = [];
            for (let i = 0; i < this.fields.length; i++)
            {
                let field = this.fields[i];
                if (field.errors.length)
                {
                    erroneousFields.push({ input: field.input, errors: field.errors });
                }
            }
            return erroneousFields;
        }
        if (input.tagName && input.tagName.toLowerCase() === "select")
        {
            return input.nwhval.errors;
        }
        return input.length ? input[0].nwhval.errors : input.nwhval.errors;
    }

    /***
     * Validates a single field, all validator functions are called and error messages are generated
     * when a validator fails
     * @param field
     * @returns {boolean}
     * @private
     */
    _validateField(field)
    {
        let errors = [];
        let valid = true;

        for (let i = 0; field.validators[i]; i++)
        {
            let validator = field.validators[i];
            let params = field.params[validator.name] ? field.params[validator.name] : [];
            params[0] = field.input.value;

            if (!validator.fn.apply(field.input, params))
            {
                valid = false;

                if (isFunction(validator.msg))
                {
                    errors.push(validator.msg(field.input.value, params))
                }
                else
                {
                    let error = field.messages[validator.name] || validator.msg;
                    errors.push(tmpl.apply(error, params));
                }

                if (validator.halt === true)
                {
                    break;
                }
            }
        }

        field.errors = errors;
        return valid;
    }

    /***
     * An utility function that returns a 2-element array, first one is the element where error/success class is
     * applied. 2nd one is the element where error message is displayed. 2nd element is created if doesn't exist and cached.
     * @param field
     * @returns {*}
     * @private
     */
    _getErrorElements(field)
    {
        if (field.errorElements)
        {
            return field.errorElements;
        }
        let errorClassElement = findAncestor(field.input, this.config.classTo);
        let errorTextParent = null, errorTextElement = null;
        if (this.config.classTo === this.config.errorTextParent)
        {
            errorTextParent = errorClassElement;
        }
        else
        {
            errorTextParent = errorClassElement.querySelector('.' + this.config.errorTextParent);
        }
        if (errorTextParent)
        {
            errorTextElement = errorTextParent.querySelector('.' + this.NWHVAL_ERROR);
            if (!errorTextElement)
            {
                errorTextElement = document.createElement(this.config.errorTextTag);
                errorTextElement.className = this.NWHVAL_ERROR + ' ' + this.config.errorTextClass;
                insertAfter(errorTextElement, field.input);
                errorTextElement.nwhvalDisplay = errorTextElement.style.display;
            }
        }
        return field.errorElements = [errorClassElement, errorTextElement]
    }

    _showError(field)
    {
        let errorElements = this._getErrorElements(field);
        let errorClassElement = errorElements[0], errorTextElement = errorElements[1];

        if (errorClassElement)
        {
            errorClassElement.classList.remove(this.config.successClass);
            errorClassElement.classList.add(this.config.errorClass);
            let input = field.input;
            if (input)
            {
                input.classList.add(this.config.errorClass);
            }
        }
        if (errorTextElement)
        {
            errorTextElement.innerHTML = field.errors.join('<br/>');
            errorTextElement.style.display = errorTextElement.nwhvalDisplay || '';
        }
    }

    /***
     * Adds error to a specific field
     * @param input
     * @param error
     */
    addError(input, error)
    {
        input = input.length ? input[0] : input;
        input.nwhval.errors.push(error);
        this._showError(input.nwhval);
    }

    _removeError(field)
    {
        let errorElements = this._getErrorElements(field);
        let errorClassElement = errorElements[0], errorTextElement = errorElements[1];
        if (errorClassElement)
        {
            // IE > 9 doesn't support multiple class removal
            errorClassElement.classList.remove(this.config.errorClass);
            errorClassElement.classList.remove(this.config.successClass);
            let input = field.input;
            if (input)
            {
                input.classList.remove(this.config.errorClass);
                input.classList.remove(this.config.successClass);
            }
        }
        if (errorTextElement)
        {
            errorTextElement.innerHTML = '';
            errorTextElement.style.display = 'none';
        }
        return errorElements;
    }

    _showSuccess(field)
    {
        let errorClassElement = this._removeError(field)[0];
        errorClassElement && errorClassElement.classList.add(this.config.successClass);

        let input = errorClassElement.querySelector('input');
        if (input)
        {
            input.classList.add(this.config.successClass);
        }
    }

    /***
     * Resets the errors
     */
    reset()
    {
        for (let i = 0; this.fields[i]; i++)
        {
            this.fields[i].errorElements = null;
        }
        Array.from(this.form.querySelectorAll('.' + this.NWHVAL_ERROR)).map(function (elem)
        {
            elem.parentNode.removeChild(elem);
        });
        Array.from(this.form.querySelectorAll('.' + this.config.classTo)).map(function (elem)
        {
            elem.classList.remove(this.config.successClass);
            elem.classList.remove(this.config.errorClass);
        });

    }

    /***
     * Resets the errors and deletes all nwhval fields
     */
    destroy()
    {
        this.reset();
        this.fields.forEach(function (field)
        {
            delete field.input.nwhval;
        });
        this.fields = [];
    }

    setGlobalConfig(config)
    {
        this.defaultConfig = config;
    }

    // /***
    //  *
    //  * @param name => Name of the global validator
    //  * @param fn => validator function
    //  * @param msg => message to show when validation fails. Supports templating. ${0} for the input's value, ${1} and
    //  * so on are for the attribute values
    //  * @param priority => priority of the validator function, higher valued function gets called first.
    //  * @param halt => whether validation should stop for this field after current validation function
    //  */
    // addValidator(name, fn, msg, priority, halt)
    // {
    //     this._setValidator(name, { fn, msg, priority, halt });
    // }

    /***
    *
    * @param elem => The dom element where the validator is applied to
    * @param fn => validator function
    * @param msg => message to show when validation fails. Supports templating. ${0} for the input's value, ${1} and
    * so on are for the attribute values
    * @param priority => priority of the validator function, higher valued function gets called first.
    * @param halt => whether validation should stop for this field after current validation function
    */
    addValidator(elem, fn, msg, priority, halt)
    {
        if (elem instanceof HTMLElement)
        {
            elem.nwhval.validators.push({ fn, msg, priority, halt });
            elem.nwhval.validators.sort((a, b) => b.priority - a.priority);
        }
        else
        {
            this._setValidator(name, { fn, msg, priority, halt });
        }
    }
}

export default Validator;