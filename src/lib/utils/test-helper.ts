import { DEPOSIT_ADDRESS } from '$lib/constants/addresses';
import { parse } from '@fleet-sdk/serializer';
import type { Box, EIP12UnsignedTransaction, SignedTransaction } from '@fleet-sdk/common';
import { ErgoAddress } from '@fleet-sdk/core';

export function decodeR4(box: Box): { userPk: string; poolPk: string } | undefined {
	const r4 = box.additionalRegisters.R4;

	if (r4) {
		const parsed = parse<Uint8Array[]>(r4);
		return {
			userPk: ErgoAddress.fromPublicKey(parsed[0]).toString(),
			poolPk: ErgoAddress.fromPublicKey(parsed[1]).toString()
		};
	}
}


export function boxAtAddress(tx: SignedTransaction, address: string): Box {
	return tx.outputs.find((o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree)!;
}

export function boxesAtAddress(tx: SignedTransaction|EIP12UnsignedTransaction, address: string): Box[] {
	// @ts-ignore
	return tx.outputs.filter((o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree);
}

export function boxesFromAddress(tx: SignedTransaction, address: string): Box[] {
	// @ts-ignore
	return tx.inputs.filter((o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree);
}

export function boxesAtAddressUnsigned(tx: EIP12UnsignedTransaction, address: string) {
	return tx.outputs.filter((o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree);
}

export function getDepositsBoxesByAddress(allBoxes: Box[], address: string) {
	const depositBoxes = allBoxes.filter(
		(b) => b.ergoTree == ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree
	);
	const addressBoxes = depositBoxes.filter((b) => decodeR4(b)?.userPk == address);
	return addressBoxes;
}

export function updateContractBoxes(
	tx: SignedTransaction | EIP12UnsignedTransaction,
	oldBoxes: Box[],
	contract: string
): Box[] {
	const boxesToDelete = tx.inputs;
	const boxesToAdd = boxesAtAddress(tx, contract);
	let newBoxes = oldBoxes?.filter((b) => !boxesToDelete.some((d) => d.boxId == b.boxId));
	if (!newBoxes) {
		newBoxes = boxesToAdd;
	} else {
		newBoxes.push(...boxesToAdd);
	}
	return newBoxes;
}
