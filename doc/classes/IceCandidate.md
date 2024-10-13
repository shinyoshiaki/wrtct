[**werift**](../README.md) • **Docs**

***

[werift](../globals.md) / IceCandidate

# Class: IceCandidate

## Constructors

### new IceCandidate()

> **new IceCandidate**(`component`, `foundation`, `ip`, `port`, `priority`, `protocol`, `type`): [`IceCandidate`](IceCandidate.md)

#### Parameters

• **component**: `number`

• **foundation**: `string`

• **ip**: `string`

• **port**: `number`

• **priority**: `number`

• **protocol**: `string`

• **type**: `string`

#### Returns

[`IceCandidate`](IceCandidate.md)

## Properties

### component

> **component**: `number`

***

### foundation

> **foundation**: `string`

***

### ip

> **ip**: `string`

***

### port

> **port**: `number`

***

### priority

> **priority**: `number`

***

### protocol

> **protocol**: `string`

***

### relatedAddress?

> `optional` **relatedAddress**: `string`

***

### relatedPort?

> `optional` **relatedPort**: `number`

***

### sdpMLineIndex?

> `optional` **sdpMLineIndex**: `number`

***

### sdpMid?

> `optional` **sdpMid**: `string`

***

### tcpType?

> `optional` **tcpType**: `string`

***

### type

> **type**: `string`

## Methods

### toJSON()

> **toJSON**(): [`RTCIceCandidate`](RTCIceCandidate.md)

#### Returns

[`RTCIceCandidate`](RTCIceCandidate.md)

***

### fromJSON()

> `static` **fromJSON**(`data`): `undefined` \| [`IceCandidate`](IceCandidate.md)

#### Parameters

• **data**: [`RTCIceCandidate`](RTCIceCandidate.md)

#### Returns

`undefined` \| [`IceCandidate`](IceCandidate.md)
