[**werift**](../README.md) • **Docs**

***

[werift](../globals.md) / CandidatePair

# Class: CandidatePair

## Constructors

### new CandidatePair()

> **new CandidatePair**(`protocol`, `remoteCandidate`): [`CandidatePair`](CandidatePair.md)

#### Parameters

• **protocol**: [`Protocol`](../interfaces/Protocol.md)

• **remoteCandidate**: [`Candidate`](Candidate.md)

#### Returns

[`CandidatePair`](CandidatePair.md)

## Properties

### handle?

> `optional` **handle**: `object`

#### cancel()

> **cancel**: () => `void`

##### Returns

`void`

#### done()

> **done**: () => `boolean`

##### Returns

`boolean`

#### promise

> **promise**: `PCancelable`\<`any`\> = `pCancel`

***

### nominated

> **nominated**: `boolean` = `false`

***

### protocol

> **protocol**: [`Protocol`](../interfaces/Protocol.md)

***

### remoteCandidate

> **remoteCandidate**: [`Candidate`](Candidate.md)

***

### remoteNominated

> **remoteNominated**: `boolean` = `false`

## Accessors

### component

> `get` **component**(): `number`

#### Returns

`number`

***

### localCandidate

> `get` **localCandidate**(): [`Candidate`](Candidate.md)

#### Returns

[`Candidate`](Candidate.md)

***

### remoteAddr

> `get` **remoteAddr**(): readonly [`string`, `number`]

#### Returns

readonly [`string`, `number`]

***

### state

> `get` **state**(): [`CandidatePairState`](../enumerations/CandidatePairState.md)

#### Returns

[`CandidatePairState`](../enumerations/CandidatePairState.md)

## Methods

### toJSON()

> **toJSON**(): `object`

#### Returns

`object`

##### protocol

> **protocol**: `string`

##### remoteAddr

> **remoteAddr**: readonly [`string`, `number`]

***

### updateState()

> **updateState**(`state`): `void`

#### Parameters

• **state**: [`CandidatePairState`](../enumerations/CandidatePairState.md)

#### Returns

`void`
