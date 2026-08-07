import { insertDraggedBlock } from './insert-dragged-block';

describe('insertDraggedBlock', () => {
  it('should gather the block behind the grabbed task', () => {
    expect(insertDraggedBlock(['b', 'c', 'a', 'd'], 'a', ['b', 'd'])).toEqual([
      'c',
      'a',
      'b',
      'd',
    ]);
  });

  it('should keep the given block order', () => {
    expect(insertDraggedBlock(['a', 'b', 'c', 'd'], 'a', ['d', 'c'])).toEqual([
      'a',
      'd',
      'c',
      'b',
    ]);
  });

  it('should handle the block already sitting behind the anchor', () => {
    expect(insertDraggedBlock(['a', 'b', 'c'], 'a', ['b'])).toEqual(['a', 'b', 'c']);
  });

  it('should leave the order alone when the anchor is missing', () => {
    expect(insertDraggedBlock(['a', 'b'], 'zzz', ['a'])).toEqual(['a', 'b']);
  });

  it('should not mutate the input', () => {
    const input = ['a', 'b', 'c'];
    insertDraggedBlock(input, 'c', ['a']);
    expect(input).toEqual(['a', 'b', 'c']);
  });
});
