/**
 * Graph to resolve and resolve dependencies
 *
 * @class Graph
 */
class Graph {
  /**
   * Create graph
   * @param {function} mapper - function to retrive ids of connect edge
   */
  constructor(mapper) {
    this._mapper = mapper
    this._nodes = new Map()
    this._connected = false
  }

  /**
   * Add node to graph
   * @param {string} id - the identify of the node
   * @param {*} ref - the data bound to the node
   *
   * @return {Graph}
   */
  add(id, ref) {
    this._nodes.set(id, new Node(id, ref))
    this._connected = false
    return this
  }

  /**
   * Connect all nodes by edges in graph
   */
  connect() {
    if (this._connected) return
    this._nodes.forEach(node => {
      let ids = this._mapper(node._ref)
      ids.forEach(id => {
        let edgeNode = this._nodes.get(id)
        if (edgeNode) node.addEdge(edgeNode)
      })
    })
    this._connected = true
  }

  /**
   * Sort nodes, return array of bound values of nodes
   */
  sort() {
    this.connect()
    let nodes = sort(this._nodes)
    return nodes.map(n => n._ref)
  }
}

/**
 * Node connected to graph
 *
 * @class Node
 */
class Node {
  /**
   * @param {string} id - the identify of the node
   * @param {*} ref - the data bound to the node
   *
   * @return {Node}
   */
  constructor(id, ref) {
    this._id = id
    this._ref = ref
    this._edges = []
  }

  /**
   * @param {Node} node - the edge node
   */
  addEdge(node) {
    let exist = this._edges.find(n => n._id === node._id)
    if (!exist) this._edges.push(node)
  }
}

/**
 * Sort the nodes by edges
 * @param {Node[]} nodes - nodes to be sorted
 *
 * return {Node[]} - sorted nodes
 */
function sort(nodes) {
  let solved = new Map()
  let unsolved = new Map()
  nodes.forEach(node => {
    solve(node, solved, unsolved)
  })
  return Array.from(solved.values())
}

/**
 * Solve node dependencies
 * @param {Node} node - focus node
 * @param {Map} solved - solved nodes
 * @param {Map} unsolved - unsolved nodes
 */
function solve(node, solved, unsolved) {
  unsolved.set(node._id, node)
  for (let edge of node._edges) {
    if (!solved.has(edge._id)) {
      if (unsolved.has(edge._id)) {
        throw new Error(`circular dependency detected, ${node._id} -> ${edge._id}`)
      }
      solve(edge, solved, unsolved)
    }
  }
  solved.set(node._id, node)
  unsolved.delete(node._id)
}

module.exports = Graph
