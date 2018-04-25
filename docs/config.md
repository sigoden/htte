## Config

Config file is a yaml file, passed to htte through cli options `-c` or `--config`. Htte will read and verify the config file at startup.

### rootDir

The default value is `'.'`

`rootDir` is a directory contained module files. Htte load the yaml in that directory recursively, then parse the file as test module.

### sessionFile

The default value is `./.session`

`sessionFile` is a file path to persist the session. Htte use session to record the request and response data of each test, the position where tests started to fail is also stored.

### url 

The default is `http://localhost:3000`

`url` is the base url of all the api. if the api use relative path, htte will get absolute path by prepend that url

### type

The default value is `json`

`type` is used to set the default encoder of request data.
encoder will set the `Content-Type` header, and encode the request body data.

### timeout

The default value is `1000`

`timeout` specifies the number of milliseconds before the request times out.
If the request takes longer than `timeout`, the request will be aborted.

### apis

`apis` is required, and it is made up of a group of endpoints. Each endpoint conatins: name, uri(required), method(default `get`), type(of encoding), timeout.

it can be in the form of mapping:

```yaml
apis:
  register:
    method: post
    uri: /users
    type: 'json'
    timeout: 300
  getUser: /user
```

or in the form of sequence:

```yaml
apis:
  - name: register
    uri: /users
    method: post
    type: 'json'
    timeout: 300
  - name: getUser
    uri: /user
```

### variables

The default value is `{}`

Variables provides the global variables. see more at [variable]('./variable.md')

### plugins

The default value is `[]`
`plugins` is an list of npm modules, see more about plugin at [plugin]('./plugin.md')
