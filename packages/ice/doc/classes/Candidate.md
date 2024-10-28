[**werift-ice**](../README.md) • **Docs**

***

[werift-ice](../globals.md) / Candidate

# Class: Candidate

## Constructors

### new Candidate()

> **new Candidate**(`foundation`, `component`, `transport`, `priority`, `host`, `port`, `type`, `relatedAddress`?, `relatedPort`?, `tcptype`?, `generation`?): [`Candidate`](Candidate.md)

#### Parameters

• **foundation**: `string`

• **component**: `number`

• **transport**: `string`

• **priority**: `number`

• **host**: `string`

• **port**: `number`

• **type**: `string`

• **relatedAddress?**: `string`

• **relatedPort?**: `number`

• **tcptype?**: `string`

• **generation?**: `number`

#### Returns

[`Candidate`](Candidate.md)

## Properties

### component

> **component**: `number`

***

### foundation

> **foundation**: `string`

***

### generation?

> `optional` **generation**: `number`

***

### host

> **host**: `string`

***

### port

> **port**: `number`

***

### priority

> **priority**: `number`

***

### relatedAddress?

> `optional` **relatedAddress**: `string`

***

### relatedPort?

> `optional` **relatedPort**: `number`

***

### tcptype?

> `optional` **tcptype**: `string`

***

### transport

> **transport**: `string`

***

### type

> **type**: `string`

## Methods

### canPairWith()

> **canPairWith**(`other`): `boolean`

#### Parameters

• **other**: [`Candidate`](Candidate.md)

#### Returns

`boolean`

***

### toSdp()

> **toSdp**(): `string`

#### Returns

`string`

***

### fromSdp()

> `static` **fromSdp**(`sdp`): [`Candidate`](Candidate.md)

#### Parameters

• **sdp**: `string`

#### Returns

[`Candidate`](Candidate.md)