import * as Keychain from 'react-native-keychain';

export const TOKEN_KEY = 'ZF_TOKEN';
export const USER_KEY = 'ZF_USER';

export async function setItem(key: string, value: string) {
  await Keychain.setGenericPassword(key, value, { service: key });
}

export async function getItem(key: string) {
  const creds = await Keychain.getGenericPassword({ service: key });
  return creds ? creds.password : null;
}

export async function removeItem(key: string) {
  await Keychain.resetGenericPassword({ service: key });
}