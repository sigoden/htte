class Graph {
  /**
   * Create an graph
   * @param {function} mapper - a function to retrive the id of connect edge
   */
  constructor(mapper) {
    this._mapper = mapper
    this._nodes = new Map()
    this._connected = false
  }

  /**
   * Add an node to graph
   * @param {*} id - use to identify the node
   * @param {*} ref - the data the node curried
   *
   * @return {Graph} - this
   */
  add(id, ref) {
    if (this._nodes.has(id)) {
      return this
    }
    this._nodes.set(id, new Node(id, ref))
    this._connected = false
    return this
  }

  /**
   * Connect the nodes in the graph
   */
  _connect() {
    if (this._connected) return
    this._nodes.forEach(node => {
      let ids = this._mapper(node._ref)
      ids.forEach(id => {
        node.addEdge(this._nodes.get(id))
      })
    })
    this._connected = true
  }

  /**
   * List the value of all the nodes, the nodes sort by the edge dependency
   */
  sort() {
    this._connect()
    let nodes = sort(this._nodes)
    return nodes.map(n => n._ref)
  }
}

class Node {
  constructor(id, ref) {
    this._id = id
    this._ref = ref
    this._edges = []
  }

  addEdge(node) {
    let exist = this._edges.find(n => n._id === node._id)
    if (!exist) this._edges.push(node)
  }
}

function sort(nodes) {
  let solved = new Map()
  let unsolved = new Map()
  nodes.forEach(node => {
    solve(node, solved, unsolved)
  })
  return Array.from(solved.values())
}

function solve(node, solved, unsolved) {
  unsolved.set(node._id, node)
  for (let edge of node._edges) {
    if (!solved.has(edge._id)) {
      if (unsolved.has(edge._id)) {
        throw new Error(`circular reference detected, ${node._id} -> ${edge._id}`)
      }
      solve(edge, solved, unsolved)
    }
  }
  solved.set(node._id, node)
  unsolved.delete(node._id)
}

module.exports = Graph
