const _ = require('lodash')
const { EOL } = require('os')

const utils = require('./utils')

const defaultOptions = { indent: '  ' }

/**
 * Logger control how to print info
 *
 * @class Logger
 */

class Logger {
  /**
   * Subtract the common parts, returns logger start have different title
   *
   * e.g.
   * Subtract(A -> B -> C, A -> B -> D) = C
   * Subtract(A -> B -> C -> D, A -> B -> D -> E) = C -> D
   *
   * @param {Logger} ref
   * @param {Logger} target
   *
   * @returns {Logger}
   */
  static subtract(target, ref) {
    let refPath = ref.path()
    let targetPath = target.path()
    let diffIndex = 0
    for (; diffIndex < targetPath.length; diffIndex++) {
      if (targetPath[diffIndex] !== refPath[diffIndex]) break
    }
    let exitCount = targetPath.length - diffIndex - 1
    let result = target
    for (let i = 0; i < exitCount; i++) {
      result = result.exit()
    }
    return result
  }
  /**
   * Create instance of Logger
   *
   * @param {string} title - title of logger
   * @param {Object} options - options of logger
   */
  constructor(title, options) {
    this.setTitle(title)
    this.setOptions(options)

    this._msgs = []
    this._level = 0
    this._children = []
  }

  /**
   * Rename the title
   * @param {string} title
   * @returns {Logger} - this
   */
  setTitle(title) {
    this._title = title || utils.randomString()
    return this
  }

  /**
   * Override the options
   * @param {Object} opts - The options
   * @returns {Logger} - this
   */
  setOptions(opts) {
    this._opts = _.defaultsDeep(opts || {}, defaultOptions)
    return this
  }

  /**
   * Log the message
   * @param {string} msg - The message to append
   */
  log(msg) {
    msg = msg.toString()

    this._msgs.push(msg)
  }

  /**
   * If logger have any message, then throw
   */
  tryThrow() {
    if (!this.dirty()) return
    throw new Error(this.toString())
  }

  /**
   * Concat the msgs and children msgs to string
   * @param {Integer} level - how many level to indent
   */
  toString(level = this._level) {
    if (!this.dirty()) return ''

    let result = this._msgs.reduce((combined, msg) => {
      return combined + `${this._indentMsg(msg, level)}${EOL}`
    }, this._indentTitle(level) + EOL)

    result += this._children.reduce((combined, child) => {
      return combined + child.toString(level + 1)
    }, '')

    return result
  }

  /**
   * Indent title line
   * @param {Integer} level - how many level to indent
   */
  _indentTitle(level) {
    return this._opts.indent.repeat(level) + this._title + ':'
  }

  /**
   * Indent msg line
   * @param {Integer} level - how many level to indent
   */
  _indentMsg(msg, level) {
    let _msg = msg.split(EOL)
    return _msg.map(v => this._opts.indent.repeat(level + 1) + v).join(EOL)
  }

  /**
   * Select the child logger, if it is not found, creates new one and returns it
   * @param {string} title - same as constructor
   *
   * @returns {Logger}
   */
  enter(title) {
    let child = this.findChild(title)
    if (child) return child
    return this._createChild(title)
  }

  /**
   * Create child logger
   * @param {string} title - title of child logger
   */
  _createChild(title) {
    let child = new Logger(title, this._opts)
    this._children.push(child)
    child._level = this._level + 1
    child._parent = this
    return child
  }

  /**
   * Select parent logger, if the parent does not exist, returns it.
   */
  exit() {
    if (!this._parent) return this
    return this._parent
  }

  /**
   * Enter logger sequentially
   * @param {string[]} titles - chain of titles
   */
  enters(titles) {
    return titles.reduce((l, title) => {
      return l.enter(title)
    }, this)
  }

  /**
   * Find the child by title
   * @param {string} title  - title of child logger
   */
  findChild(title) {
    return _.find(this._children, { _title: title })
  }

  /**
   * Clear the msgs recursivelly
   */
  clear() {
    this._msgs = []
    this._children.forEach(l => l.clear())
  }

  /**
   * Get the path from root logger
   */
  path() {
    if (!this._parent) return [this._title]
    return this._parent.path().concat([this._title])
  }

  /**
   * Whether the logger have any msg or children has any msg
   */
  dirty() {
    return !(this._msgs.length === 0 && this._children.every(child => !child.dirty()))
  }
}

module.exports = Logger
