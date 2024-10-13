[**werift**](../README.md) • **Docs**

***

[werift](../globals.md) / Connection

# Class: Connection

## Constructors

### new Connection()

> **new Connection**(`iceControlling`, `options`?): [`Connection`](Connection.md)

#### Parameters

• **iceControlling**: `boolean`

• **options?**: `Partial`\<[`IceOptions`](../interfaces/IceOptions.md)\>

#### Returns

[`Connection`](Connection.md)

## Properties

### \_localCandidatesEnd

> **\_localCandidatesEnd**: `boolean` = `false`

***

### \_tieBreaker

> **\_tieBreaker**: `bigint`

***

### checkList

> **checkList**: [`CandidatePair`](CandidatePair.md)[] = `[]`

***

### iceControlling

> **iceControlling**: `boolean`

***

### localCandidates

> **localCandidates**: [`Candidate`](Candidate.md)[] = `[]`

***

### localPassword

> **localPassword**: `string`

***

### localUserName

> **localUserName**: `string`

***

### lookup?

> `optional` **lookup**: `MdnsLookup`

***

### nominated?

> `optional` **nominated**: [`CandidatePair`](CandidatePair.md)

***

### onData

> `readonly` **onData**: [`Event`](Event.md)\<[`Buffer`, `number`]\>

***

### options

> **options**: [`IceOptions`](../interfaces/IceOptions.md)

***

### remoteCandidatesEnd

> **remoteCandidatesEnd**: `boolean` = `false`

***

### remoteIsLite

> **remoteIsLite**: `boolean` = `false`

***

### remotePassword

> **remotePassword**: `string` = `""`

***

### remoteUsername

> **remoteUsername**: `string` = `""`

***

### restarted

> **restarted**: `boolean` = `false`

***

### state

> **state**: `IceState` = `"new"`

***

### stateChanged

> `readonly` **stateChanged**: [`Event`](Event.md)\<[`IceState`]\>

***

### stunServer?

> `optional` **stunServer**: readonly [`string`, `number`]

***

### turnServer?

> `optional` **turnServer**: readonly [`string`, `number`]

***

### useIpv4

> **useIpv4**: `boolean`

***

### useIpv6

> **useIpv6**: `boolean`

## Accessors

### remoteCandidates

> `get` **remoteCandidates**(): [`Candidate`](Candidate.md)[]

> `set` **remoteCandidates**(`value`): `void`

#### Parameters

• **value**: [`Candidate`](Candidate.md)[]

#### Returns

[`Candidate`](Candidate.md)[]

## Methods

### addRemoteCandidate()

> **addRemoteCandidate**(`remoteCandidate`): `Promise`\<`void`\>

#### Parameters

• **remoteCandidate**: `undefined` \| [`Candidate`](Candidate.md)

#### Returns

`Promise`\<`void`\>

***

### checkIncoming()

> **checkIncoming**(`message`, `addr`, `protocol`): `void`

#### Parameters

• **message**: [`Message`](Message.md)

• **addr**: readonly [`string`, `number`]

• **protocol**: [`Protocol`](../interfaces/Protocol.md)

#### Returns

`void`

***

### checkStart()

> **checkStart**(`pair`): `PCancelable`\<`unknown`\>

#### Parameters

• **pair**: [`CandidatePair`](CandidatePair.md)

#### Returns

`PCancelable`\<`unknown`\>

***

### close()

> **close**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

***

### connect()

> **connect**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

***

### dataReceived()

> **dataReceived**(`data`, `component`): `void`

#### Parameters

• **data**: `Buffer`

• **component**: `number`

#### Returns

`void`

***

### gatherCandidates()

> **gatherCandidates**(`cb`?): `Promise`\<`void`\>

#### Parameters

• **cb?**

#### Returns

`Promise`\<`void`\>

***

### getDefaultCandidate()

> **getDefaultCandidate**(): [`Candidate`](Candidate.md)

#### Returns

[`Candidate`](Candidate.md)

***

### requestReceived()

> **requestReceived**(`message`, `addr`, `protocol`, `rawData`): `void`

#### Parameters

• **message**: [`Message`](Message.md)

• **addr**: readonly [`string`, `number`]

• **protocol**: [`Protocol`](../interfaces/Protocol.md)

• **rawData**: `Buffer`

#### Returns

`void`

***

### resetNominatedPair()

> **resetNominatedPair**(): `void`

#### Returns

`void`

***

### send()

> **send**(`data`): `Promise`\<`void`\>

#### Parameters

• **data**: `Buffer`

#### Returns

`Promise`\<`void`\>

***

### setRemoteParams()

> **setRemoteParams**(`__namedParameters`): `void`

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.iceLite**: `boolean`

• **\_\_namedParameters.password**: `string`

• **\_\_namedParameters.usernameFragment**: `string`

#### Returns

`void`
