import { ethers, Wallet } from "ethers";
import { CHAINS_CONFIG, mumbai } from "../interfaces/Chain";

export async function sendToken(
  amount: number,
  to: string,
  privateKey: string
) {
  const chain = CHAINS_CONFIG[mumbai.chainId];
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const wallet: Wallet = new ethers.Wallet(privateKey, provider);

  const tx = { to, value: ethers.parseEther(amount.toString()) };

  const transaction = await wallet.sendTransaction(tx);

  const receipt = await transaction.wait();

  return { transaction, receipt };
}
