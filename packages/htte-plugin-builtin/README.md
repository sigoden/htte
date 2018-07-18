# HTTE 内置插件

## 概念介绍

插件以 YAML 自定义标签的形式呈现。在 HTTE 中，就是函数。

有这样一段代码
```yaml
req:
  body: !$concat [a, b, c]
res:
  body: !@regexp \w{3}
```
将插件 `!$concat` 和 `!@regexp` 用函数替换
```js
{
    req:
        body: function(ctx) {
            return (function(literal) {
                return literal.join('');
            })(['a', 'b', 'c'])
        }
    res:
        body: function(ctx, actual) {
            (function(literal) {
                let re = new Regexp(literal);
                if (!re.test(actual)) {
                    ctx.throw('不匹配正则')
                }
            })('\w{3}')
        }
}
```
上面就是 HTTE 执行引擎看到的代码原本面貌了。

接口测试中主要存在两种需求，构造请求数据和校验相应数据。 所以 HTTE 中存在两种插件。
- 构造器(resolver)，用来构造数据，标签前缀 `!$`
- 比对器(differ)，用来比对校验数据，标签前缀 `!@`


标签值(literal)数据类型，也就是 YAML 数据类型：
- 纯量(scalar)：是最基本的、不可再分的值。包含数据类型: 字符串, 布尔值, 数值, null
- 数组(sequence): 一组按次序排列的值，又成为序列/列表 `- Cat\n- Dog`，也可以采用内联形式 `[Cat, Dog]`
- 对象(mapping): 键值对的集合，又称为映射/哈希/字典。 `name: tom\nage: 20`，也可采用形式 `{name: tom, aget: 20}`

关于 YAML 标签，有必要补充一点，那就是标签是需要与数据类型绑定的。如 `!$concat` 就绑定了 `sequence`， `!$concat a` 会编译不通过。

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

## !@arrylike mapping sequence

从数组对象的角度校验实际值数组。在只关注数组长度和某些特定元素的情况下很有用。

```yaml
- describe: diff array by see array as arraylike object
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

## !@compare mapping{op,value} scalar

数字大小比对。判断实际值 \<op\> 标签值，可选的操作 \<op\> 有: gt, gte, lt, lte, ne, eq

```yaml
- describe: asset actual gt literal
  req:
    body: 3
  res:
    body: !@compare
      op: gt
      value: 2
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

实际值在标签值定义的范围内，则测试通过。

没用 basis 范围: `min <= actual < max`
带上 basis 范围: `min <= actual - basis < max`

```yaml
- describe: asset value in range
  req:
    body:
      v1: 3
      v2: -3
  res:
    body:
      v1: !@range [3, 3.000001]
      v2: !@range [-3, -2.999999]

- describe: asset value minus basis value in range
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

实际值时间在标签值定义的范围内，则测试通过。

没用 basis 范围: `min <= actual - now < max`
带上 basis 范围: `min <= actual - basis < max`

```yaml

- describe: asset time in range
  req:
    body:
      v: '2018-07-16T03:26:17.000Z'
  res:
    body:
      v: !@rangetime [0, 3600.001, '2018-07-16T02:26:17.000Z']

- describe: asset time in range with basis of now
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

标签值规则: `<length>:<flag>`。`length` 代表生成字符串长度,`flag` 用来限定字符集，`n` 只用数字字符， `l` 只用小写字母，`u` 只用大小字母，彼此间可以组合， `nl` 或 `ln` 数字+小写。`nlu` 或缺省则标识字符集是数字+大小写字母

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