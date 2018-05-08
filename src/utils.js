const fs = require('fs')
const yaml = require('js-yaml')
const recursiveReadSync = require('recursive-readdir-sync')
const _ = require('lodash')
const path = require('path')
const mkdir = require('mkdir')

/**
 * Help functions
 */
module.exports = {
  /**
   * load yaml file
   * @param {string} filePath - yaml file path
   * @param {Object} options - options to load yaml
   */
  loadYamlSync: (filePath, options) => {
    let content = fs.readFileSync(filePath, 'utf8')
    return yaml.load(content, options)
  },

  /**
   * Check Whether the directory exists, make directory if it does not
   * @param {string} directoryPath - path of directory
   */
  directoryExistsSync: directoryPath => {
    try {
      let stat = fs.statSync(directoryPath)
      return stat.isDirectory()
    } catch (e) {
      return false
    }
  },

  /**
   * Sort files on alphabet, directory in front of file
   * @param {string[]} paths - array of file paths
   * @param {string} sep - path seperator
   */
  sortFiles: (paths, sep = path.sep) => {
    return paths
      .map(el => el.split(sep))
      .sort((a, b) => {
        let l = Math.max(a.length, b.length)
        for (let i = 0; i < l; i += 1) {
          if (a[i].toUpperCase() > b[i].toUpperCase()) return +1
          if (a[i].toUpperCase() < b[i].toUpperCase()) return -1
          if (a.length < b.length) return -1
          if (a.length > b.length) return +1
        }
      })
      .map(el => el.join(sep))
  },

  /**
   * Ensure file existed
   * @param {string} file - which file path
   */
  ensureFileSync: file => {
    let stats
    try {
      stats = fs.statSync(file)
    } catch (e) {}
    if (stats && stats.isFile()) return

    const dir = path.dirname(file)
    if (!fs.existsSync(dir)) {
      mkdir.mkdirsSync(dir)
    }

    fs.writeFileSync(file, '')
  },

  /**
   * Find files in an directory recursivelly
   */
  recursiveReadSync,

  /**
   * Get the relative file path, then remove extension
   * e.g. filePath is /tmp/a/b.yaml, directoryPath is /tmp/a, result is b
   *
   * @param {string} directoryPath - the path of directory of file
   * @param {string} filePath - the path of file
   */
  shortenFilePath: (directoryPath, filePath) => {
    let relativePath = path.relative(directoryPath, filePath)
    let ext = path.extname(filePath)
    return relativePath.slice(0, relativePath.length - ext.length)
  },

  /**
   * Collect url params from url
   * e.g. /post/{id}/comment/{cid} -> [id, cid]
   *
   * @param {string} pathname - pathname of url
   */
  collectUrlParams: pathname => {
    const RE_URL_PARAM_VAR = /^\{.*\}$/
    let varSet = new Set()
    pathname
      .split('/')
      .filter(seg => RE_URL_PARAM_VAR.test(seg))
      .forEach(seg => {
        varSet.add(seg.slice(1, -1))
      })
    return Array.from(varSet.values()).sort()
  },

  /**
   * Fill the url params
   * e.g. uri is /post/{id}/comment/{cid}, params is { id: 33, cid: 42}, result is /post/33/comment/42
   * @param {string} uri - uri had hole
   * @param {Object} params - parmas value
   */
  fillUrlParams: (uri, params) => {
    for (let k in params) {
      uri = uri.replace(new RegExp(`{${k}}`, 'g'), params[k])
    }
    return uri
  },

  /**
   * Get duplicated elems in array, like [1, 2, 1] -> [2]
   */
  duplicateElements: array => {
    return _.filter(array, (value, index, iteratee) => {
      return _.includes(iteratee, value, index + 1)
    })
  },

  /**
   * Whether url is valid
   */
  isValidHttpUrl: url => {
    return /^https?:\/\/[\w\-]+(\.[\w\-]+)*(:\d+)?(\/[\w\-]+)*\/?$/.test(url)
  },

  /**
   * Generate random string
   */
  randomString: (length = 6) => {
    let result = ''
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
      result += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return result
  },

  /**
   * typeof value
   */
  type,

  /**
   * Whether value is in the types
   */
  isTypeOf: (value, types) => {
    if (!Array.isArray(types)) types = [types]
    let t = type(value)
    return types.some(type => type === t)
  },

  /**
   * Merge contentType Options
   * mergeTypeOptions('application/json', { charset: 'utf-8' }) === 'application/json; charset=utf-8'
   */
  mergeTypeOptions: (base, options) => {
    if (type(options) !== 'object') return base
    return Object.keys(options).reduce((acc, key) => {
      acc += `; ${key}=${options[key]}`
      return acc
    }, base)
  },

  /**
   * Print error stack in debug mode, only print normal message in normal mode
   */
  print: debug => {
    return msg => {
      if (msg instanceof Error) {
        console.log(debug ? msg : msg.message)
        return
      }
      console.log(msg)
    }
  }
}

function type(value) {
  let t = typeof value
  switch (t) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'undefined':
    case 'function':
      return t
    default:
      if (value === null) return 'null'
      if (Array.isArray(value)) return 'array'
      return 'object'
  }
}
