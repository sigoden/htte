## module

Each module is realy a yaml file. this module file have two parts: dependencies and units.

### dependencies

`dependencies` guarantee the order of the tests.

The api test should run in order. A user can not publish an article before he or she registed. Htte load all the files in the `rootDir` as modules, it sorts the modules on the file path first, then sorts the modules by the dependency.

Considerd there is a `auth` module contains the test about registing and loging, a `article` module contains the test of CRUD about the article. it is obvious that `auth` module should run before `article` module. Adding `auth` module to the dependencies of `article` module guarantees that order. 

What's more, once a module included the other modules in the `dependencies`, the test in that module can use the variable from dependency modules.

each dependency have properties: module(file path relative to the dependent module), name. Htte use the path to generate name when dependency name ommited.

`dependencies` in the form of mapping:

```yaml
dependencies:
  - ./auth.yaml
  - name: article
    module: ./article.yaml
```

In the form of sequence:

```yaml
dependencies:
  auth: ./auth.yaml
  article: ./article.yaml
```

### Units

Units is group of test-unit or child units.

```yaml
units:
  - describe: feed
    api: getFeed
    req:
      headers:
        Authorization: !$concat ['Token', ' ', !$query $auth.loginJohn.res.body.user.token]
    res:
      body:
        articles: []
        articlesCount: 0
  - describe: article without auth
    units:
      - describe: all articles
        api: listArticles
```

The top-level `units` have `feed` test-unit and `article without auth` units. the child units also have a test-unit `all articles`. units can have any amounts and any level of test-unit or units.

### test-unit

test-unit describe how htte make a request and how htte diff the response.

test-unit may have properties:
```yaml
describe:
api:
name:
req:
  params: 
  headers:
  query:
  body:
res:
  status:
  headers:
  body:
```

- describe, an description of the test, it is required
- api, the endpoint of the test, lookup on the `apis` of config
- name, the name of the test. Test without name will not be available by querying the variable by other tests.
- req, the request of the test.
  - params, the params of url. If api have uri `/articles/{slug}/comments/{id}`, and params must be `{ slug: ???, id: ??? }`. two params should match.
  - query, the query string of url, must be in the form of mapping.
  - headers, the http headers of request
  - body, the body of request
- res
  - status, the status of response. If ommited, htte will asset the response between 200 and 299.
  - headers, the http headers of response
  - body, the body of response
