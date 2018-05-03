const _ = require('lodash')
const { EOL } = require('os')

const utils = require('./utils')

const defaultOptions = { follow: false, indent: '  ', logFunc: console.log }

/**
 * Logger control how to print info
 *
 * @class Logger
 */

class Logger {
  /**
   * Create instance of Logger
   *
   * @param {string} title - title of logger
   * @param {Object} options - options of logger
   * @param {boolean} options.follow - immeridate call logFunc while receiving a new msg
   * @param {function} options.logFunc - function to process the log string
   */
  constructor(title, options) {
    this.setTitle(title)
    this.setOptions(options)

    this._msgs = []
    this._level = 0
    this._children = []
    this._index = -1
    this._focus = -1
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

    if (this._opts.follow) {
      this._follow(msg)
    }
  }

  /**
   * Follow the msg when options follow is true
   * @param {string} msg - The message to follow
   */
  _follow(msg) {
    if (this._isRoot()) {
      // print root logger only once
      if (!this._followedRoot) {
        this._opts.logFunc(this._indentTitle())
        this._opts.logFunc(this._indentMsg(msg))
        return
      }
    }

    // print title of chaing loggers
    let chain = this._dirtyChain([])

    if (chain.length) {
      let top = chain[chain.length - 1].exit()
      top._unfocusChildren()

      chain.forEach(l => {
        if (l._parent) {
          l._parent._focus = l._index
        }
      })
      let titles = chain
        .reverse()
        .map(l => l._indentTitle())
        .join(EOL)

      this._opts.logFunc(titles)
    }

    this._opts.logFunc(this._indentMsg(msg))
  }

  /**
   * Whether the logger is root
   */
  _isRoot() {
    return !this._parent
  }

  /**
   * Get the chain of affected loggers when changed focus
   *
   * a
   * +--b
   *    +--c
   *    |  +--d --> chain1
   *    +--e
   *       +--f --> chain2
   *
   * when changing focus from node from d to f, the affected loggers will be [e, f]
   */
  _dirtyChain(chain) {
    if (this._isRoot()) {
      if (this._followedRoot) return chain
      return chain.concat([this])
    }

    let parent = this._parent
    if (this._index === parent._focus) {
      return chain
    }

    return parent._dirtyChain(chain.concat([this]))
  }

  /**
   * Clear the cached focus recursivelly
   */
  _unfocusChildren() {
    this._children.forEach(l => {
      l._focus = -1
      l._unfocusChildren()
    })
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
  _indentTitle(level = this._level) {
    if (this._isRoot()) this._followedRoot = true
    return this._opts.indent.repeat(level) + this._title + ':'
  }

  /**
   * Indent msg line
   * @param {Integer} level - how many level to indent
   */
  _indentMsg(msg, level = this._level) {
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
    child._index = this._children.length - 1
    child._parent = this
    return child
  }

  /**
   * Select parent logger, if the parent does not exist, returns it.
   */
  exit() {
    if (this._isRoot()) return this
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
   * Whether the logger have any msg or children has any msg
   */
  dirty() {
    return !(this._msgs.length === 0 && this._children.every(child => !child.dirty()))
  }
}

module.exports = Logger
