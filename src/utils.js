const fs = require('fs')
const yaml = require('js-yaml')
const recursiveReadSync = require('recursive-readdir-sync')
const _ = require('lodash')
const path = require('path')
const mkdir = require('mkdir')

module.exports = {
  /**
   * load yaml file
   * @param {string} filePath - yaml file path
   * @param {object} options - options to load yaml
   * @returns {*} - object repersent yaml content
   */
  loadYamlSync: (filePath, options) => {
    let content = fs.readFileSync(filePath, 'utf8')
    return yaml.load(content, options)
  },

  /**
   * Check Whether exist directory, sync
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
   * Sort files on alphabet, directory commom fist than file
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
   * Make sure file exist on dist
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
   * Convert an file path to relative path, and remove the ext
   */
  shortenFilePath: (directoryPath, filePath) => {
    let relativePath = path.relative(directoryPath, filePath)
    let ext = path.extname(filePath)
    return relativePath.slice(0, relativePath.length - ext.length)
  },

  /**
   * Collect the param from url, like /post/{id}/comment/{cid} -> [id, cid]
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
   * Fill the params in url
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
