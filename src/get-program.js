// @flow

type Pos = {
  line: number,
  column: number
};

type Loc = {
  start: Pos,
  end: Pos
};

type Program = { text: string, loc: Loc, offset: Pos };

export default function( source: Object, node: Object ): ?Program {

  // Ignore if body is empty.
  if ( node.body.length === 0 ) {
    return;
  }

  const body0 = node.body[0];
  const comments0 = node.comments[0];
  let start;
  let range;

  // With babel-eslint, program.loc.start.column is always 0,
  // workaround it by using the first node of the body to get the offset.

  if ( comments0 ) {
    start = node.range[0] < comments0.range[0] ? {
      line: body0.loc.start.line,
      column: body0.loc.start.column
    } : {
      line: comments0.loc.start.line,
      column: comments0.loc.start.column
    };
    range = [
      Math.min( node.range[0], comments0.range[0] ),
      Math.max( node.range[1], node.comments[node.comments.length - 1].range[1] )
    ];
  } else {
    start = {
      line: body0.loc.start.line,
      column: body0.loc.start.column
    };
    range = node.range;
  }

  return {
    text: source.text.slice( range[0], range[1] ),
    loc: {
      start,
      end: start
    },
    offset: {
      line: start.line - 1,
      column: start.column
    }
  };
}
