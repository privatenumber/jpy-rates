import crypto from 'node:crypto';
import * as XLSX from 'xlsx';
import { f as fetchSource } from './fetch-source-BHAj9IoI.mjs';

const rc4Transform = (key, data) => {
  const state = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) {
    state[i] = i;
  }
  let j = 0;
  for (let i = 0; i < 256; i += 1) {
    j = j + state[i] + key[i % key.length] & 255;
    [state[i], state[j]] = [state[j], state[i]];
  }
  const output = new Uint8Array(data.length);
  let si = 0;
  let sj = 0;
  for (let k = 0; k < data.length; k += 1) {
    si = si + 1 & 255;
    sj = sj + state[si] & 255;
    [state[si], state[sj]] = [state[sj], state[si]];
    output[k] = data[k] ^ state[state[si] + state[sj] & 255];
  }
  return output;
};
const biff8Rc4DeriveKey = (password, salt, block) => {
  const passwordBuffer = Buffer.from(password, "utf16le");
  const h0 = crypto.createHash("md5").update(passwordBuffer).digest();
  const truncated = h0.subarray(0, 5);
  const unit = Buffer.concat([truncated, salt]);
  const parts = [];
  for (let i = 0; i < 16; i += 1) {
    parts.push(unit);
  }
  const h1 = crypto.createHash("md5").update(Buffer.concat(parts)).digest();
  const blockBytes = Buffer.alloc(4);
  blockBytes.writeUInt32LE(block, 0);
  return crypto.createHash("md5").update(Buffer.concat([h1.subarray(0, 5), blockBytes])).digest();
};
const NON_ENCRYPTED_RECORDS = /* @__PURE__ */ new Set([
  2057,
  // BOF
  47,
  // FilePass
  404,
  // UsrExcl
  405,
  // FileLock
  225,
  // InterfaceHdr
  406,
  // RRDInfo
  312
  // RRDHead
]);
const FILEPASS_RECORD = 47;
const BOUNDSHEET8_RECORD = 133;
const BLOCK_SIZE = 1024;
const defaultPassword = "VelvetSweatshop";
const passwordMismatchMessage = "Cannot open encrypted workbook: Excel's default password did not match.";
const malformedFilePassMessage = "Cannot open encrypted workbook: malformed FilePass metadata";
const decryptBiff8Rc4 = (data, salt) => {
  const plainBytes = [];
  const encryptedParts = [];
  let offset = 0;
  while (offset < data.length - 3) {
    const recordType = data[offset] | data[offset + 1] << 8;
    const recordSize = data[offset + 2] | data[offset + 3] << 8;
    const recordEnd = offset + 4 + recordSize;
    if (recordType === FILEPASS_RECORD) {
      plainBytes.push(0, 0, data[offset + 2], data[offset + 3]);
      for (let i = 0; i < recordSize; i += 1) {
        plainBytes.push(0);
      }
      encryptedParts.push(new Uint8Array(4 + recordSize));
    } else if (NON_ENCRYPTED_RECORDS.has(recordType)) {
      for (let i = offset; i < recordEnd; i += 1) {
        plainBytes.push(data[i]);
      }
      encryptedParts.push(new Uint8Array(4 + recordSize));
    } else if (recordType === BOUNDSHEET8_RECORD) {
      for (let i = offset; i < offset + 8; i += 1) {
        plainBytes.push(data[i]);
      }
      for (let i = 0; i < recordSize - 4; i += 1) {
        plainBytes.push(-2);
      }
      encryptedParts.push(
        new Uint8Array(8),
        data.slice(offset + 8, recordEnd)
      );
    } else {
      for (let i = offset; i < offset + 4; i += 1) {
        plainBytes.push(data[i]);
      }
      for (let i = 0; i < recordSize; i += 1) {
        plainBytes.push(-1);
      }
      encryptedParts.push(
        new Uint8Array(4),
        data.slice(offset + 4, recordEnd)
      );
    }
    offset = recordEnd;
  }
  let totalLength = 0;
  for (const part of encryptedParts) {
    totalLength += part.length;
  }
  const encryptedBuffer = new Uint8Array(totalLength);
  let position = 0;
  for (const part of encryptedParts) {
    encryptedBuffer.set(part, position);
    position += part.length;
  }
  const decryptedBuffer = new Uint8Array(encryptedBuffer.length);
  let block = 0;
  for (let i = 0; i < encryptedBuffer.length; i += BLOCK_SIZE) {
    const key = biff8Rc4DeriveKey(defaultPassword, salt, block);
    const chunk = encryptedBuffer.subarray(i, Math.min(i + BLOCK_SIZE, encryptedBuffer.length));
    decryptedBuffer.set(rc4Transform(key, chunk), i);
    block += 1;
  }
  const result = new Uint8Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i += 1) {
    result[i] = plainBytes[i] < 0 ? decryptedBuffer[i] : plainBytes[i];
  }
  return result;
};
const validateCryptoApiAlgorithms = (metadata) => {
  const flags = metadata.getUint32(14, true);
  const algorithm = metadata.getUint32(22, true);
  const hashAlgorithm = metadata.getUint32(26, true);
  const keySize = metadata.getUint32(30, true);
  const providerType = metadata.getUint32(34, true);
  if ((flags & 52) !== 4 || algorithm !== 26625 || hashAlgorithm !== 32772 || providerType !== 1) {
    throw new Error(`Cannot open encrypted workbook: unsupported CryptoAPI algorithms (flags 0x${flags.toString(16)}, cipher 0x${algorithm.toString(16)}, hash 0x${hashAlgorithm.toString(16)}, provider ${providerType}).`);
  }
  if (keySize < 40 || keySize > 128 || keySize % 8 !== 0) {
    throw new Error(`Cannot open encrypted workbook: unsupported RC4 CryptoAPI key size ${keySize}.`);
  }
};
const parseCryptoApiMetadata = (metadata) => {
  if (metadata.byteLength < 14) {
    throw new Error(`${malformedFilePassMessage}: truncated CryptoAPI header.`);
  }
  const headerSize = metadata.getUint32(10, true);
  const verifierOffset = 14 + headerSize;
  if (headerSize < 34 || headerSize % 2 !== 0 || verifierOffset + 60 !== metadata.byteLength) {
    throw new Error(`${malformedFilePassMessage}: invalid CryptoAPI header or verifier size.`);
  }
  if (metadata.getUint32(6, true) !== metadata.getUint32(14, true) || metadata.getUint32(18, true) !== 0 || metadata.getUint16(verifierOffset - 2, true) !== 0) {
    throw new Error(`${malformedFilePassMessage}: invalid CryptoAPI header fields.`);
  }
  if (metadata.getUint32(verifierOffset, true) !== 16 || metadata.getUint32(verifierOffset + 36, true) !== 20) {
    throw new Error(`${malformedFilePassMessage}: invalid CryptoAPI salt or verifier hash size.`);
  }
  validateCryptoApiAlgorithms(metadata);
  return { type: "cryptoapi" };
};
const parseFilePass = (bytes) => {
  const metadata = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 2) {
    throw new Error(`${malformedFilePassMessage}: missing encryption type.`);
  }
  const encryptionType = metadata.getUint16(0, true);
  if (encryptionType === 0) {
    if (bytes.length !== 6) {
      throw new Error(`${malformedFilePassMessage}: invalid XOR metadata size.`);
    }
    throw new Error("Cannot open encrypted workbook: unsupported encryption type 0 (XOR obfuscation).");
  }
  if (encryptionType !== 1) {
    throw new Error(`Cannot open encrypted workbook: unsupported encryption type ${encryptionType}.`);
  }
  if (bytes.length < 6) {
    throw new Error(`${malformedFilePassMessage}: truncated encryption version.`);
  }
  const major = metadata.getUint16(2, true);
  const minor = metadata.getUint16(4, true);
  const version = `${major}.${minor}`;
  if (version === "1.1") {
    if (bytes.length !== 54) {
      throw new Error(`${malformedFilePassMessage}: standard RC4 requires a 16-byte salt, verifier, and verifier hash.`);
    }
    return {
      type: "rc4",
      salt: bytes.subarray(6, 22),
      encryptedVerifier: bytes.subarray(22, 38),
      encryptedVerifierHash: bytes.subarray(38, 54)
    };
  }
  if (["2.2", "3.2", "4.2"].includes(version)) {
    return parseCryptoApiMetadata(metadata);
  }
  throw new Error(`Cannot open encrypted workbook: unsupported encryption version ${major}.${minor} (type ${encryptionType}).`);
};
const validateFilePassPosition = (records, offset) => {
  if (records.getUint16(0, true) !== 2057 || records.getUint16(2, true) < 4) {
    throw new Error(`${malformedFilePassMessage}: missing workbook BOF.`);
  }
  const biffVersion = records.getUint16(4, true);
  if (biffVersion !== 1536) {
    throw new Error(`Cannot open encrypted workbook: unsupported BIFF version 0x${biffVersion.toString(16)}.`);
  }
  let expectedOffset = 4 + records.getUint16(2, true);
  if (records.getUint16(expectedOffset, true) === 134) {
    expectedOffset += 4 + records.getUint16(expectedOffset + 2, true);
  }
  if (offset !== expectedOffset) {
    throw new Error(`${malformedFilePassMessage}: misplaced FilePass record.`);
  }
};
const findFilePass = (data) => {
  const records = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;
  while (offset < data.length) {
    if (offset + 4 > data.length) {
      throw new Error("Malformed XLS workbook: truncated BIFF record header.");
    }
    const recordType = records.getUint16(offset, true);
    const recordSize = records.getUint16(offset + 2, true);
    const recordEnd = offset + 4 + recordSize;
    if (recordEnd > data.length) {
      throw new Error(recordType === FILEPASS_RECORD ? `${malformedFilePassMessage}: truncated FilePass record.` : "Malformed XLS workbook: truncated BIFF record.");
    }
    if (recordType === FILEPASS_RECORD) {
      validateFilePassPosition(records, offset);
      return parseFilePass(data.subarray(offset + 4, recordEnd));
    }
    if (recordType === 10) {
      return null;
    }
    offset = recordEnd;
  }
  return null;
};
let officeCrypto;
const getOfficeCrypto = async () => {
  if (!officeCrypto) {
    const module = await import('officecrypto-tool');
    officeCrypto = module.default;
  }
  return officeCrypto;
};
const decryptCryptoApiWorkbook = async (bytes) => {
  const oc = await getOfficeCrypto();
  try {
    return await oc.decrypt(Buffer.from(bytes), { password: defaultPassword });
  } catch (error) {
    if (error instanceof Error && error.message === "The password is incorrect") {
      throw new Error(passwordMismatchMessage, { cause: error });
    }
    throw error;
  }
};
const parseXlsBuffer = async (input) => {
  const xlsBuffer = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  const cfb = XLSX.CFB.read(xlsBuffer, { type: "array" });
  const workbookEntry = cfb.FileIndex.find((entry) => entry.name === "Workbook" || entry.name === "Book");
  if (!workbookEntry) {
    if (cfb.FileIndex.some((entry) => entry.name === "EncryptionInfo" || entry.name === "EncryptedPackage")) {
      throw new Error("Cannot open encrypted workbook: unsupported encrypted container (expected a BIFF8 Workbook stream).");
    }
    return XLSX.read(xlsBuffer, { type: "array" });
  }
  const data = new Uint8Array(workbookEntry.content);
  const filePass = findFilePass(data);
  if (!filePass) {
    return XLSX.read(xlsBuffer, { type: "array" });
  }
  if (filePass.type === "rc4") {
    const key = biff8Rc4DeriveKey(defaultPassword, filePass.salt, 0);
    const verifierBytes = rc4Transform(key, Buffer.concat([
      filePass.encryptedVerifier,
      filePass.encryptedVerifierHash
    ]));
    const verifierHash = crypto.createHash("md5").update(verifierBytes.subarray(0, 16)).digest();
    if (!crypto.timingSafeEqual(verifierHash, verifierBytes.subarray(16))) {
      throw new Error(passwordMismatchMessage);
    }
    workbookEntry.content = decryptBiff8Rc4(data, filePass.salt);
    return XLSX.read(XLSX.CFB.write(cfb), { type: "array" });
  }
  const decrypted = await decryptCryptoApiWorkbook(xlsBuffer);
  return XLSX.read(decrypted, { type: "buffer" });
};
const fetchXls = async (url, options) => {
  const response = await fetchSource(url, options);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  const xlsBuffer = await response.arrayBuffer();
  return parseXlsBuffer(xlsBuffer);
};
const getSheet = (workbook, name) => {
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    throw new Error(`Sheet '${name}' not found. Available: ${workbook.SheetNames.join(", ")}`);
  }
  return sheet;
};
const sheetToRows = (sheet) => XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  defval: null
});
const millisecondsPerDay = 864e5;
const excelDateToIso = (serial) => {
  const adjustedSerial = serial > 59 ? serial - 1 : serial;
  return new Date(Date.UTC(1899, 11, 31) + adjustedSerial * millisecondsPerDay).toISOString().slice(0, 10);
};

export { excelDateToIso as e, fetchXls as f, getSheet as g, parseXlsBuffer as p, sheetToRows as s };
