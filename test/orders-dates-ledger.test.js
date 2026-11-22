'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

function sampleOrders() {
  return [
    { id: 1004, date: '30/01/2022' },
    { id: 1001, date: '28/12/2021' },
    { id: 1008, date: '15/03/2022' },
    { id: 1007, date: '04/03/2022' }
  ];
}

test('CORRECT BEHAVIOUR — order history sorts dates newest first across months and years', function () {
  var list = orders.list({ orders: sampleOrders() }, {});

  assert.deepEqual(list.map(function (order) { return order.id; }), [1008, 1007, 1004, 1001]);
});

test('CORRECT BEHAVIOUR — date range filters compare calendar dates, not DD/MM text', function () {
  var list = orders.list({ orders: sampleOrders() }, {
    from: '2022-03-01',
    to: '2022-03-31'
  });

  assert.deepEqual(list.map(function (order) { return order.id; }), [1008, 1007]);
});

test('CORRECT BEHAVIOUR — string settlement amounts update khata balances numerically', function () {
  var db = {
    customers: [{
      id: 3,
      name: 'Meera Joshi',
      openingBalance: 0,
      totalBilled: 2432.01,
      totalSettled: 1200
    }],
    settlements: [],
    nextSettlementId: 503
  };

  assert.equal(ledger.listCustomers(db)[0].balance, 1232.01);

  var result = ledger.recordSettlement(db, 3, '500', 'upi', 'Settlement');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(typeof result.settlement.amount, 'number');
  assert.equal(ledger.listCustomers(db)[0].balance, 732.01);
});
