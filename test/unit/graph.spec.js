const Graph = require('../../src/graph')

describe('Test Graph', () => {
  test('private property', () => {
    let fn = () => []
    let graph = new Graph(fn)
    expect(graph._mapper).toBe(fn)
    expect(graph._nodes).toBeInstanceOf(Map)
    expect(graph._connected).toBe(false)
  })
  describe('add', () => {
    test('should work', () => {
      let graph = new Graph(v => v.edges)
      graph.add('a', { id: 'a', edges: [] })
      graph.add('b', { id: 'b', edges: [] })
      let ids = Array.from(graph._nodes.entries()).map(([id]) => id)
      expect(ids).toEqual(['a', 'b'])
    })
    test('should override exists node', () => {
      let graph = new Graph(v => v.edges)
      graph.add('a', { id: 'a', edges: [] })
      graph.add('b', { id: 'b', edges: [] })
      graph.add('a', { id: 'a', edges: ['b'] })
      expect(graph._nodes.get('a')._ref.edges).toEqual(['b'])
    })
    test('should disable connected state when add new node', () => {
      let graph = new Graph(v => v.edges)
      graph.add('a', { id: 'a', edges: [] })
      graph.add('b', { id: 'b', edges: [] })
      graph.connect()
      expect(graph._connected).toBe(true)
      graph.add('c', { id: 'c', edges: [] })
      expect(graph._connected).toBe(false)
    })
  })
  describe('connect', () => {
    test('should work', () => {
      let graph = new Graph(v => v.edges)
      graph.add('a', { id: 'a', edges: [] })
      graph.add('b', { id: 'b', edges: ['a'] })
      graph.connect()
      expect(graph._connected).toBe(true)
      expect(graph._nodes.get('b')._edges).toEqual([graph._nodes.get('a')])
    })
    test('result is cached', () => {
      let graph = new Graph(v => v.edges)
      graph.add('a', { id: 'a', edges: [] })
      graph.add('b', { id: 'b', edges: ['a'] })
      graph.connect()
      graph._mapper = () => {
        throw new Error()
      }
      graph.connect()
    })
    test('ignore edge if not find or duplicate', () => {
      let graph = new Graph(v => v.edges)
      graph.add('a', { id: 'a', edges: [] })
      graph.add('b', { id: 'b', edges: ['a', 'c', 'a'] })
      graph.connect()
      expect(graph._nodes.get('b')._edges.map(v => v._ref.id)).toEqual(['a'])
    })
  })
  describe('sort', () => {
    test('should work', () => {
      let graph = new Graph(v => v.edges)
      graph.add('a', { id: 'a', edges: ['b'] })
      graph.add('b', { id: 'b', edges: [] })
      graph.add('c', { id: 'c', edges: ['b'] })
      expect(Array.from(graph._nodes.values()).map(v => v._ref.id)).toEqual(['a', 'b', 'c'])
      expect(graph.sort().map(v => v.id)).toEqual(['b', 'a', 'c'])
    })
    test('throw error if circular dependency', () => {
      let graph = new Graph(v => v.edges)
      graph.add('a', { id: 'a', edges: ['b'] })
      graph.add('b', { id: 'b', edges: ['a'] })
      expect(() => graph.sort()).toThrow('circular dependency detected, b -> a')
    })
  })
})
