# NWH Validator - Frontend validation done right.

This library is a fully working and up to date (Bootstrap 5+) validator for any HTML form.

## Installation

### NPM

```bash
npm install nwhval
```

### YARN

```bash
yarn add nwhval
```

## Usage

```js
import Validator from "nwhval";

const form = document.querySelector("#my-form");
const validator = new Validator(form);

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (validator.validate()) {
    // form is valid, get ready for backend validation !
  }
});
```

## Configuration

You can pass parameters to the validator constructor to configure it.

| Parameter         | Description                                              | Default value      | Available Options           |
| ----------------- | -------------------------------------------------------- | ------------------ | --------------------------- |
| `styling `        | Wether to use Bootstrap 4 or 5 styling                   | `bootstrap-5`      | `boostrap-4`, `bootstrap-5` |
| `classTo`         | Class to add to the form-group                           | `form-group`       |                             |
| `errorClass`      | Class to add to the form-group when the field is invalid | `is-invalid `      |                             |
| `successClass`    | Class to add to the form-group when the field is valid   | `is-valid `        |                             |
| `errorTextParent` | Parent element to add the error text                     | `form-group `      |                             |
| `errorTextTag`    | Tag to use to add the error text                         | `div`              |                             |
| `errorTextClass`  | Class to add to the error text                           | `invalid-feedback` |                             |
| `live`            | Whether to validate the form on keyup or on submit       | `true`             |                             |
| `lang`            | Language to use for the error messages                   | `en`               | `fr`, `es`, `en`            |

### A note on the `lang` parameter

Currently, only English, French and Spanish are supported. Feel free to add your own language and open a merge request !
