import crypto from "crypto";

// Verifies passwords against hashes produced by ASP.NET Core Identity's
// default PasswordHasher (format marker 0x01, "V3"). Needed so existing
// users in the MySQL `User` table can still log in once this backend
// replaces the .NET one, without anyone resetting their password.
//
// Layout (all counts big-endian / network byte order), from
// https://github.com/dotnet/aspnetcore PasswordHasher<TUser>.VerifyHashedPasswordV3:
//   byte 0        : format marker, must be 0x01
//   bytes 1-4     : PRF identifier (0 = SHA1, 1 = SHA256, 2 = SHA512)
//   bytes 5-8     : iteration count
//   bytes 9-12    : salt size in bytes
//   next N bytes  : salt
//   remaining     : derived subkey
//
// ASP.NET Identity 2.x (pre-.NET Core, "V2") used a different, simpler
// fixed-size HMACSHA1 format with no embedded marker byte 0x01 at all —
// if the existing `User` table predates ASP.NET Core, hashes may be in
// that format instead and this function will need a V2 branch. Confirm
// which Identity version produced the stored hashes before relying on
// this for production logins.

const PRF_NAMES = { 0: "sha1", 1: "sha256", 2: "sha512" };

export function verifyNetIdentityPasswordV3(hashedPasswordBase64, password) {
  const hashBytes = Buffer.from(hashedPasswordBase64, "base64");

  if (hashBytes.length < 13 || hashBytes[0] !== 0x01) {
    throw new Error(
      "Unsupported password hash format (expected ASP.NET Identity V3)"
    );
  }

  const prf = hashBytes.readUInt32BE(1);
  const iterationCount = hashBytes.readUInt32BE(5);
  const saltSize = hashBytes.readUInt32BE(9);

  const prfName = PRF_NAMES[prf];
  if (!prfName) {
    throw new Error(`Unsupported PRF identifier: ${prf}`);
  }

  const headerSize = 13;
  const salt = hashBytes.subarray(headerSize, headerSize + saltSize);
  const expectedSubkey = hashBytes.subarray(headerSize + saltSize);

  const derivedSubkey = crypto.pbkdf2Sync(
    password,
    salt,
    iterationCount,
    expectedSubkey.length,
    prfName
  );

  return (
    derivedSubkey.length === expectedSubkey.length &&
    crypto.timingSafeEqual(derivedSubkey, expectedSubkey)
  );
}

// For any NEW passwords created by this backend going forward, so we
// don't need bcrypt alongside this scheme. Defaults match ASP.NET Core
// Identity's own defaults (SHA256, 100 000 iterations since .NET 8;
// older services may have used 10 000 — doesn't matter for new hashes).
export function hashNetIdentityPasswordV3(
  password,
  { iterationCount = 100_000, saltSize = 16, subkeySize = 32 } = {}
) {
  const salt = crypto.randomBytes(saltSize);
  const subkey = crypto.pbkdf2Sync(
    password,
    salt,
    iterationCount,
    subkeySize,
    "sha256"
  );

  const header = Buffer.alloc(13);
  header[0] = 0x01;
  header.writeUInt32BE(1, 1); // PRF = SHA256
  header.writeUInt32BE(iterationCount, 5);
  header.writeUInt32BE(saltSize, 9);

  return Buffer.concat([header, salt, subkey]).toString("base64");
}
