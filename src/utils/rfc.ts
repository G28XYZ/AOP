import { Service } from 'typedi';

@Service('IP_RFC_3330')
export class IP_RFC_3330 {
	ranges = [
		{ vtypeName: 'rfc3330_10', min: 167772160, max: 184549375, minMask: 8 },
		{ vtypeName: 'rfc3330_172', min: 2886729728, max: 2887778303, minMask: 12 },
		{ vtypeName: 'rfc3330_192', min: 3232235520, max: 3232301055, minMask: 16 },
	];

	isNotInRanges(ip: string, mask: string) {
		const IPRangeObject = this.getIPRangeObject(ip);
		return IPRangeObject === undefined || IPRangeObject.minMask > this.maskToNumber(mask);
	}

	ipToNumber(ip: string) {
		if (true) {
			let arr: string[] = ip.split('.');
			return +arr[0] * Math.pow(256, 3) + +arr[1] * Math.pow(256, 2) + +arr[2] * 256 + +arr[3];
		} else {
			return null;
		}
	}

	getIPRangeObject(ip: string) {
		let ipNumber = this.ipToNumber(ip),
			rangeIndex: undefined | number;

		this.ranges.every(function (item, index) {
			if (ipNumber !== null && ipNumber > item.min && ipNumber < item.max) {
				rangeIndex = index;
				return false;
			}
			return true;
		});

		return this.ranges[rangeIndex as any];
	}

	maskToNumber(ip: string) {
		let arr: (string | number)[] = ip.split('.'),
			mask: number = 0,
			div,
			test;

		for (let i = 0; i < 4; i++) {
			div = 256;
			while (div > 1) {
				div = div / 2;
				test = +arr[i] - div;
				if (test > -1) {
					mask = mask + 1;
					arr[i] = test;
				} else {
					break;
				}
			}
		}
		return mask;
	}

	createBinaryString(value: number) {
		//  функция преобразования десятичного целого со знаком в правильный бинарник без знака (с единичками вначале) https://gist.github.com/wemakeweb/4961037
		let nFlag = 0,
			nShifted = value,
			sMask = '';
		for (nFlag = 0; nFlag < 32; nFlag++) {
			sMask += String(nShifted >>> 31);
			nShifted <<= 1;
		}
		return sMask;
	}

	convertIntToIP(value: number) {
		return (
			((value >> 24) & 0xff).toString() +
			'.' +
			((value >> 16) & 0xff).toString() +
			'.' +
			((value >> 8) & 0xff).toString() +
			'.' +
			(value & 0xff).toString()
		);
	}

	bitMaskToIp(bitMask: number) {
		let mask = '';
		for (let i = 32; i > 0; i--, bitMask--) {
			mask += bitMask > 0 ? '1' : '0';
		}
		return this.convertIntToIP(parseInt(mask, 2));
	}

	getMaxAddress(address: number, mask: number) {
		return parseInt(this.createBinaryString(address | ~mask), 2);
	}

	getMinAddress(address: number, mask: number) {
		return parseInt(this.createBinaryString(address & mask), 2);
	}

	getOptimalRange(ipNum: number, ipEndNum: number) {
		let prefixSize;
		let optimalRange = null;

		for (prefixSize = 32; prefixSize >= 0; prefixSize -= 1) {
			const maskRange = this.getMaskRange(ipNum, prefixSize);

			if (maskRange.ipLow === ipNum && maskRange.ipHigh <= ipEndNum) {
				optimalRange = maskRange;
			} else {
				break;
			}
		}

		return optimalRange;
	}

	getPrefixMask(prefixSize: number) {
		let mask = 0;
		let i;

		for (i = 0; i < prefixSize; i += 1) {
			mask += (1 << (32 - (i + 1))) >>> 0;
		}

		return mask;
	}

	getMask(maskSize: number) {
		let mask = 0;
		let i;

		for (i = 0; i < maskSize; i += 1) {
			mask += (1 << i) >>> 0;
		}

		return mask;
	}

	getMaskRange(ipNum: number, prefix: number) {
		const maskIp = this.getPrefixMask(prefix);
		const lowMask = this.getMask(32 - prefix);
		const ipLow = (ipNum & maskIp) >>> 0;
		const ipHigh = (((ipNum & maskIp) >>> 0) + lowMask) >>> 0;

		return {
			ipLow,
			ipHigh,
			maskIp: this.convertIntToIP(maskIp),
			prefix,
		};
	}

	/** метод из пакета ip-subnet-calculator */
	calculateIp(ipStart: string, ipEnd: string) {
		let ipStartNum: number;
		let ipEndNum: number;
		let ipCurNum: number;
		const rangeCollection = [];

		try {
			ipStartNum = this.ipToNumber(ipStart);
			ipEndNum = this.ipToNumber(ipEnd);
		} catch (err) {
			return null;
		}

		if (ipEndNum < ipStartNum) {
			return null;
		}

		ipCurNum = ipStartNum;

		while (ipCurNum <= ipEndNum) {
			const optimalRange = this.getOptimalRange(ipCurNum, ipEndNum);

			if (optimalRange === null) {
				return null;
			}

			rangeCollection.push(optimalRange);

			ipCurNum = optimalRange.ipHigh + 1;
		}

		return rangeCollection;
	}
}
