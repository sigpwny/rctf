/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // expose json field for allowing additional metadata on a solve
    pgm.addColumns('solves', {
        metadata: { type: 'jsonb', notNull: true, default: '{}' }
    })
};

exports.down = pgm => {
    pgm.dropColumns('solves', ['metadata'])
};
