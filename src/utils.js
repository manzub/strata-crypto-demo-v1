/* utils file - handles all utility functions
    - saveNewBlock
    - saveWalletData
    - updateWalletBalance

*/
const fs = require("fs");
const crypto = require("crypto");
const { Keccak } = require("sha3");
const { v1: uuidV1 } = require("uuid");
const { ESC_STR, BLOCKS_DIR, WALLETS_DIR, INITIAL_BALANCE } = require("./config");

const createNewHash = (data) => {
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(data))
    return hash.digest('hex');
}

const saveNewBlock = (data) => {
    let dataToWrite = JSON.stringify(data).replaceAll(':',ESC_STR);
    fs.writeFile(BLOCKS_DIR+`data_${data.timestamp}.txt`,dataToWrite,(err)=>console.log(err))
}

const saveWalletData = ({ dataToWrite, walletId }) => {
    fs.writeFile(WALLETS_DIR+`${walletId}__key.txt`, dataToWrite, (err)=>console.log(err))
    fs.writeFile(WALLETS_DIR+`${walletId}__bal.txt`, INITIAL_BALANCE.toFixed(2), (err)=>console.log(err))
}

const updateWalletBalance = ({ walletId, newBalance }) => {
    fs.writeFile(WALLETS_DIR+`${walletId}__bal.txt`, `${newBalance}`, (err)=>console.log(err ? err : 'Saved!'))
}

const newWalletId = () => {
    const hash = new Keccak(256)
    hash.update(`${uuidV1()}${Math.floor(Math.random()*9999)+1}`)
    return hash.digest('hex').toString();
}
const doMath = (num1, num2) => {
    let n1 = `${num1}`.split(".")
    let n2 = `${num2}`.split(".")
    let n3 = parseInt(n1[0]) + parseInt(n2[0]);
    let decimal = parseInt(n1[1]) + parseInt(n2[1]);
    return `${n3}.${decimal}`;
}

const signTransaction = ({ senderWallet, transaction }) => {
    const signature = crypto.sign("sha256", Buffer.from(JSON.stringify(transaction)), {
        key: senderWallet.privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING
    })
    return signature.toString("hex")
}

const verifySignature = ({ senderWallet, transaction, signature }) => {
    return crypto.verify("sha256", Buffer.from(JSON.stringify(transaction)), {
        key: senderWallet.publicKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING
    }, Buffer.from(signature, "hex"))
}

module.exports = { 
    createNewHash, 
    saveNewBlock, 
    saveWalletData,
    newWalletId,
    updateWalletBalance,
    verifySignature,
    signTransaction,
    uuidV1,
    utils:fs,
}