# HTTE 内置插件

> 如果不清楚插件的概念，请查阅 [使用插件灵活生成请求校验响应](https://github.com/sigoden/htte#使用插件灵活生成请求校验响应)

## !@and sequence *

标签值数组中每个元素都是一条比对规则。如果实际值通过了所有这些比对，则测试通过；任意一条失败，则测试失败。

```yaml
- describe: all pass will pass
  req:
    body: 3
  res:
    body: !@and
    - !@compare {op: gt, value: 1}
    - !@compare {op: gt, value: 2}
```

## !@array sequence sequence

标签值数组是实际值的子集，则测试通过。

```yaml
- describe: each element must exist
  req:
    body:
    - 3
    - 4
    - 5
  res:
    body: !@array
    - 4
    - 3
```

## !@arraylike mapping sequence

校验数组长度和特定索引下元素

```yaml
- describe: diff array length and the element at the index
  req:
    body:
    - 1
    - 2
    - 3
  res:
    body: !@arraylike
      length: 3
      1: 2
```

校验数组中存在元素满足 '?' 中的条件

```yaml
- describe: element exist
  req:
    body:
    - 1
    - 2
    - 3
  res:
    body: !@arraylike
      '?': 2
```

校验数组中的元素均满足 '*' 中的条件

```yaml
- describe: elements all pass
  req:
    body:
    - 1
    - 2
    - 3
  res:
    body: !@arraylike
      '*': !@compare
        op: gt
        value: 0
```

## !@compare mapping{op,value} scalar

数字大小比对。判断实际值 \<op\> 标签值，可选的操作 \<op\> 有: gt, gte, lt, lte, ne, eq

```yaml
- describe: assert actual gt literal
  req:
    body: 3
  res:
    body: !@compare
      op: gt
      value: 2
```

## !@eval mapping{js, args} *

通过脚本比对结果

```yaml
- describe: compare range with eval
  req:
    body:
      v1: !$range [1, 4]
  res:
    body:
      v1: !@eval
        js: >
          $ = _ >= min && _ <= max
        args:
          max: 0
          min: 4

```

`args` 中定义变量，`js` 中执行运算，`$` 是最终结果(bool)，`_`是需要断言的值。

## !@object mapping{op,value} mapping

标签值是实际值的子集，则测试通过。

```yaml
- describe: use object plugin to diff key only interested
  req:
    body:
      k1: a
      k2: b
  res:
    body: !@object
      k1: a
```

## !@or sequence *

标签值数组中每个元素都是一条比对规则。如果实际值通过了任意一个比对，则测试通过；所以比对都失败，则测试失败。

```yaml
- describe: any pass will pass
  req:
    body: 3
  res:
    body: !@or
    - !@compare {op: gt, value: 4}
    - !@compare {op: gt, value: 2}
```

## !@query scalar<string> *

实际值与标签值所引用的数据相等，则测试通过。 

```yaml
- describe: diff with query data
  name: u1
  req:
    body:
      v1: !$randstr
  res:
    body:
      v1: !@query req.body.v1
```

## !@range sequence[min, max, basis] scalar

> 会在下一个版本废弃

实际值在标签值定义的范围内，则测试通过。

没用 basis 范围: `min <= actual < max`
带上 basis 范围: `min <= actual - basis < max`

```yaml
- describe: assert value in range
  req:
    body:
      v1: 3
      v2: -3
  res:
    body:
      v1: !@range [3, 3.000001]
      v2: !@range [-3, -2.999999]

- describe: assert value minus basis value in range
  req:
    body:
      v1: 3
      v2: -3
  res:
    body:
      v1: !@range [0, 0.000001, 3]
      v2: !@range [0, 0.000001, -3]
```

## !@rangetime sequence[min, max, basis] scalar

> 会在下一个版本废弃

实际值时间在标签值定义的范围内，则测试通过。

没用 basis 范围: `min <= actual - now < max`
带上 basis 范围: `min <= actual - basis < max`

```yaml

- describe: assert time in range
  req:
    body:
      v: '2018-07-16T03:26:17.000Z'
  res:
    body:
      v: !@rangetime [0, 3600.001, '2018-07-16T02:26:17.000Z']

- describe: assert time in range with basis of now
  req:
    body:
      v: !$time 0
  res:
    body:
      v: !@rangetime [-0.01, 0.01]
```

## !@regexp scalar<string> scalar

实际值匹配正则，则测试通过。

```yaml
- describe: regexp test
  req:
    body:
      v: '123'
  res:
    body:
      v: !@regexp \d{3}
```

## !@exist scalar *

判断实际值存在，如果有标签值，同时还判断实际值是标签值描述的类型

```yaml
- describe: we only care the existance of k2, not its value
  req:
    body:
      k1: a
      k2: b
  res:
    body:
      k1: a
      k2: !@exist
- describe: v must be number
  req:
    body:
      v: [] 
  res:
    body:
      v: !@exist array
```


## !$concat sequence

返回拼接字符串

```yaml
- describe: concat array to string
  req:
    body: !$concat ['a', 'b', 'c']
  res:
    body: abc
```

## !$convert mapping{to, value}

类型转换， 目标类型有: string, number, boolean, integer, array

```yaml
- describe: array to string
  req:
    body: !$convert
      to: string
      value: [1, 2, 3]
  res:
    body: '[1,2,3]'
- describe: object to string
  req:
    body: !$convert
      to: string
      value:
        a: 3
        b: 4
  res:
    body: '{"a":3,"b":4}'
- describe: string to integer
  req:
    body: !$convert
      to: integer
      value: '3.2'
  res:
    body: 3
- describe: wrap into array
  req:
    body: !$convert
      to: array
      value: 3
  res:
    body: [3]
```

## !$eval mapping{js, args}

执行脚本获取结果

```yaml
- describe: eval
  req:
    body: !$eval
      js: >
        $ = a * b
      args:
        a = 3
        b = 5
  res:
    body: 15 
```

`args` 中定义变量，`js` 中执行运算，`$` 是最终运算结果

## !$query scalar<string>

引用标签值指向的数据

```yaml
- describe: prepare data
  name: u1
  req:
    body:
      a:
        b: v1
      c:
      - d: v2

- describe: query data in other unit
  req:
    body: 
      v1: !$query u1.req.body.a.b
      v2: !$query u1.req.body.c[0].d
```

## !$randnum sequence[min, max]

> 会在下一个版本废弃

生成某个范围内的随机数

```yaml
- describe: generate random float between [min, max]
  req:
    body:
      v: !$randnum [1, 5]
  res:
    body:
      v: !@range [1, 5]
```

## !$randstr scalar<string>

生成随机字符串

标签值规则: `<length>:<flag>`。`length` 代表生成字符串长度,`flag` 用来限定字符集，`n` 只用数字字符， `l` 只用小写字母，`u` 只用大写字母，彼此间可以组合， `nl` 或 `ln` 数字+小写。`nlu` 或缺省则标识字符集是数字+大小写字母

```yaml
- describe: generate random str
  req:
    body:
      v: !$randstr
  res:
    body:
      v: !@regexp \w{1,62}

- describe: generate random str contains only a-z0-9
  req:
    body:
      v: !$randstr '6:nl'
  res:
    body:
      v: !@regexp '[a-z0-9]{6}'
```

## !$time scalar<string>

> 会在下一个版本废弃

生成时间。

标签值格式 `<timestring> <before|after>? <basis>`

`timestring` 格式:
> - ms, milli, millisecond, milliseconds - 毫秒
> - s, sec, secs, second, seconds - 秒
> - m, min, mins, minute, minutes - 分
> - h, hr, hrs, hour, hours - 时
> - d, day, days - 天
> - w, week, weeks - 星期
> - mon, mth, mths, month, months - 月
> - y, yr, yrs, year, years - 年

> 组合形式方式类似 `1d 3h 25m 18s`

`basis` 缺省表示当前时间

```yaml
- describe: now
  req:
    body: !$time
  res:
    body: !@rangetime [-0.01, 0.01]

- describe: after 1h 3m
  req:
    body: !$time '1h 3m'
  res:
    body: !@rangetime [3779.99, 3780.01]

- describe: before 1w 2h
  req:
    body: !$time '1w 2h before'
  res:
    body: !@rangetime [-612000.01, -611999.9]

- describe: 1h before 2018-07-09T06:00:00.000Z
  req:
    body: !$time '1h before 2018-07-09T06:00:00.000Z'
  res:
    body: !@rangetime [0, 0.01, '2018-07-09T05:00:00.000Z']
```

## !$mock scalar

使用 [mockjs](http://mockjs.com/) 生成数据

```yaml
- describe: mock data
  req:
    body:
      color: !$mock '@hex'
      natural: !$mock '@natural(10, 20)'
  res:
    body:
      color: !$regexp #\d{6}
      natural: !@and
      - !@compare {op: gte, value: 10}
      - !@compare {op: lt, value: 20}
```

`color` 值等同于 `Mock.hex()`, `natural` 值等同 `Mock.natural(10,20)`

## !$mock/o mapping

使用 [mockjs](http://mockjs.com/) 生成数据

```yaml
- describe: mock object
  req:
    body: !$moco
      'list|1-10':
        - 'id|+1': 1
  res:
    body:
      list: !@arraylike
        length: !@compare {op: lte, value: 10}
        0:
          id: 1
```

```yaml
    body: !$moco
      'list|1-10':
        - 'id|+1': 1
```

等同于
```js
body = Mock.mock({
    // 属性 list 的值是一个数组，其中含有 1 到 10 个元素
    'list|1-10': [{
        // 属性 id 是一个自增数，起始值为 1，每次增 1
        'id|+1': 1
    }]
});
```