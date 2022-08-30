import { BN, units, bytes, Zilliqa } from "@zilliqa-js/zilliqa";
import appConstants from "appConstants";
import { useEffect, useState } from "react";
import * as hash from "hash.js";

const {
  getAddressFromPrivateKey,
  getPubKeyFromPrivateKey,
  sign,
  toBech32Address,
  fromBech32Address,
} = require('@zilliqa-js/crypto');

export const useZilpay = () => {
  const { network } = appConstants;
  const [zilPay, setZilPay] = useState(
    (typeof window !== "undefined" && window.zilPay) || ""
  );
  const [wallet, setWallet]= useState({})
  const [errorMessage, setErrorMessage] = useState(null);
  const zilliqa = new Zilliqa(
    network === "testnet"
      ? "https://dev-api.zilliqa.com"
      : "https://api.zilliqa.com"
  );

  useEffect(()=>{
    setTimeout(()=>{
        console.log(window.zilPay)
        setZilPay(window.zilPay)
    },600)
  }, [])

  useEffect(() => {
    setZilPay(window.zilPay);
    if (window.zilPay) {
      setTimeout(async () => {
        const walletDetail = window.localStorage.getItem("wallet-address");
        if (walletDetail) {
          localStorage.setItem("zilchill-zp", true);
        }
      }, 1000);
    }
  }, [zilPay]);

  const connectWallet = async () =>
    new Promise((resolve, reject) => {
      if (!zilPay) {
        reject(new Error("Zilpay Not Found"));
      }
      if (zilPay.wallet.net !== network) {
        reject(new Error("Network Mismatch"));
      }
      zilPay.wallet.connect().then((isConnect) => {
        if (isConnect) {
            setWallet(zilPay.wallet.defaultAccount)
          window.localStorage.setItem(
            "wallet-address",
            JSON.stringify(zilPay.wallet.defaultAccount)
          );
          resolve(zilPay.wallet.defaultAccount);
        } else {
          reject(new Error("User Rejected"));
        }
      });
    });

  const getContractState = async (contractAddress) => {
    if (zilPay) {
      if (zilPay.wallet.net !== network) {
        throw new Error("Network Mismatch");
      }
      await zilPay.wallet.connect();
      const contract = zilPay.contracts.at(contractAddress);
      return contract.getState();
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error("Zilpay Not Found"));
      });
    }
  };

  const callTransaction = async (
    contractAddress,
    transition,
    params,
    amount,
    gasLimit
  ) => {
    if (zilPay) {
      await zilPay.wallet.connect();
      if (zilPay.wallet.net !== network) {
        throw new Error("Network Mismatch");
      }
    }
    const contract = zilPay.contracts.at(contractAddress);
    const gasPrice = units.toQa("2000", units.Units.Li);
    const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
    const isGasSufficient = gasPrice.gte(new BN(minGasPrice.result));
    if (!isGasSufficient) {
      throw new Error("Gas not Sufficient");
    }
    await connectWallet();
    return contract.call(transition, params, {
      amount: amount
        ? units.toQa(amount.toString(), units.Units.Zil)
        : units.toQa("0", units.Units.Zil),
      gasPrice,
      gasLimit: gasLimit || 2500,
    });
  };

  const signMessage = async (message) => {
    console.log("SIGNING...");
    let privkey = '8b6f072a20ec787e14fc63a03dbaaaac0ba9394c89955aeb61c61ab94f7b17ef';
    // 0297acf983c92c1f671a0c24baafeff7e61590706ebbd38ec85f745ebb58fbf165

    const pubkey = getPubKeyFromPrivateKey(privkey);
    console.log("pubkey", pubkey);
    // if (zilPay) {
    //   await zilPay.wallet.connect();
    //   if (zilPay.wallet.net !== network) {
    //     throw new Error("Network Mismatch");
    //   }

    //   // const signed = await window.zilPay.wallet.sign(message);
    //   const { signature, message, publicKey } = await window.zilPay.wallet.sign(message);
    //   console.log("Printed" ,signature, message, publicKey);

    //   return signature;
    // } else {
    //   return new Promise((resolve, reject) => {
    //     reject(new Error("Zilpay Not Found"));
    //   });
    // }
      const amount = 2;
      const nonce = 13;
      const fee = 2;
      //without 0x
      const contractAddr = "c0824cffed69becb61742e553b0e8be96996df38";
  
      const amount_bn = new BN(amount)
      const nonce_bn = new BN(nonce)
      const fee_bn = new BN(fee)
      const uint_amt = Uint8Array.from(amount_bn.toArrayLike(Buffer, undefined, 16))
      const uint_nonce = Uint8Array.from(nonce_bn.toArrayLike(Buffer, undefined, 16))
      const uint_fee = Uint8Array.from(fee_bn.toArrayLike(Buffer, undefined, 16))

      // without 0x
      let to = "8A1BB6924800a72aD46aA958C482A21358E11e7E";
      const to_hash = hash.sha256().update(bytes.hexToByteArray(to)).digest('hex')

      const amount_hash = hash.sha256().update(uint_amt).digest('hex')
      
      const contract_hash = hash.sha256().update(bytes.hexToByteArray(contractAddr)).digest('hex')
      
      const fee_hash = hash.sha256().update(uint_fee).digest('hex')

      const nonce_hash = hash.sha256().update(uint_nonce).digest('hex')

      const msg_buf = Buffer.from(to_hash + amount_hash + contract_hash + fee_hash + nonce_hash, 'hex')

      let msg_string = new String(msg_buf);

      console.log(msg_string);
      const isConnect = await window.zilPay.wallet.connect();
    if (isConnect) {
      const { signature, msg, publicKey } = await window.zilPay.wallet.sign(msg_string);
      console.log("Printed", isConnect ,signature, msg, publicKey);
//67b7f79d107cc72952bc0310228fcaa612200316008fdb916c1bcf82654d8c5e575716e8cf0d85ad5092c13eddc90b934215715bf8efd3387a3d060e3ca65b74
    }

  };

  return {
    getContractState,
    connectWallet,
    callTransaction,
    errorMessage,
    signMessage,
    setErrorMessage,
    wallet
  };
};
