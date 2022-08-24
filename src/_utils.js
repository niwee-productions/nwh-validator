export function findAncestor(el)
{
    return el.parentNode;
}

export function tmpl()
{
    return this.replace(/\${([^{}]*)}/g, (a, b) => arguments[b]);
}

export function groupedElemCount(input)
{
    return input.nwhval.self.form.querySelectorAll('input[name="' + input.getAttribute('name') + '"]:checked').length;
}

export function mergeConfig(obj1, obj2)
{
    for (let attr in obj2)
    {
        if (!(attr in obj1))
        {
            obj1[attr] = obj2[attr];
        }
    }
    return obj1;
}

export function isFunction(obj)
{
    return !!(obj && obj.constructor && obj.call && obj.apply);
}


export function insertAfter(newNode, referenceNode)
{
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}