[**werift**](../README.md) • **Docs**

***

[werift](../globals.md) / RTCIceTransport

# Class: RTCIceTransport

## Constructors

### new RTCIceTransport()

> **new RTCIceTransport**(`gather`): [`RTCIceTransport`](RTCIceTransport.md)

#### Parameters

• **gather**: [`RTCIceGatherer`](RTCIceGatherer.md)

#### Returns

[`RTCIceTransport`](RTCIceTransport.md)

## Properties

### connection

> **connection**: [`Connection`](Connection.md)

***

### id

> `readonly` **id**: `string`

***

### onStateChange

> `readonly` **onStateChange**: [`Event`](Event.md)\<[`"disconnected"` \| `"closed"` \| `"completed"` \| `"new"` \| `"connected"` \| `"failed"` \| `"checking"`]\>

***

### state

> **state**: `"disconnected"` \| `"closed"` \| `"completed"` \| `"new"` \| `"connected"` \| `"failed"` \| `"checking"` = `"new"`

## Accessors

### iceGather

> `get` **iceGather**(): [`RTCIceGatherer`](RTCIceGatherer.md)

#### Returns

[`RTCIceGatherer`](RTCIceGatherer.md)

***

### role

> `get` **role**(): `"controlling"` \| `"controlled"`

#### Returns

`"controlling"` \| `"controlled"`

## Methods

### addRemoteCandidate()

> **addRemoteCandidate**(`candidate`?): `undefined` \| `Promise`\<`void`\>

#### Parameters

• **candidate?**: [`IceCandidate`](IceCandidate.md)

#### Returns

`undefined` \| `Promise`\<`void`\>

***

### setRemoteParams()

> **setRemoteParams**(`remoteParameters`): `void`

#### Parameters

• **remoteParameters**: [`RTCIceParameters`](RTCIceParameters.md)

#### Returns

`void`

***

### start()

> **start**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>
