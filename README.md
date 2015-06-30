# columbus

An UDP-based service discovery module with a simple API.

## Installation

```sh
npm install --save columbus
```

## Usage example

### Advertise a service (Server)

```js
var columbus = require('columbus')();

columbus.advertise({
    name: 'my-service',
    port: process.env.PORT
});

```

### Get the connection information of a service (Client)

```js

var columbus = require('columbus')();

columbus.need('my-service', function onAnswer (err, config) {
    if (err) {
        return console.error('Meh: ' + err.toString());
    }

    console.log(config.name); // e.g. my-service
    console.log(config.ipaddress); // e.g. 172.1.0.12
    console.log(config.port); // e.g. 8080
});

```

### ENV variables

If you want to interact with services outside of your subnet (e.g. testing your local environment with online services), you can do so by adding environment variables with ip and port (e.g. "COLUMBUS_SOME_SERVICE=172.1.0.12:8080"). If a matching variable is found, columbus will return that configuration and not initialize further.

The variable should be uppercase with COLUMBUS prefix and underscores between words (no dashes).


## API

### `advertise(configuration[, callback])`

Optional: `callback`

Will advertise a service. Please note that the attributes `name` and `port` are mandatory.

### `need(name, callback)`

Will fetch the connection information of a service. The result object that will be passed to the `callback` as a second parameter
provides the following attributes:

  * `name`: The name of the respective service.
  * `ipaddress`: The ip address of the respective service.
  * `port`: The port of the respective service.

## Tests

```sh
npm test
```

## Author

Copyright, 2014-2015 [priorist.com](http://priorist.com)
