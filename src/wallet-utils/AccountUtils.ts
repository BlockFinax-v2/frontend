import { Wallet, HDNodeWallet } from "ethers";
import { Account } from "../interfaces/Account";

export function generateAccount(
  seedPhrase: string = "",
  index: number = 0
): { account: Account; seedPhrase: string } {
  let wallet: Wallet | HDNodeWallet;

  if (seedPhrase === "") {
    const randomWallet = Wallet.createRandom();
    seedPhrase = randomWallet.mnemonic?.phrase || "";
    wallet = randomWallet;
  } else {
    // If the seed phrase contains spaces, it is likely a mnemonic
    if (seedPhrase.includes(" ")) {
      const hdNode = HDNodeWallet.fromPhrase(seedPhrase);
      wallet = hdNode.derivePath(`m/44'/60'/0'/0/${index}`);
    } else {
      wallet = new Wallet(seedPhrase);
    }
  }

  const { address } = wallet; // we are capturing address variable from 'wallet' object

  const account = { address, privateKey: wallet.privateKey, balance: "0" };

  // If the seedphrase does not include spaces then it's actually a private key, so return a blank string.
  return { account, seedPhrase: seedPhrase.includes(" ") ? seedPhrase : "" };
}
