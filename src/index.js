const express = require('express');
const cors = require('cors');
const { PublicKey, Connection, clusterApiUrl, Keypair, Transaction } = require('@solana/web3.js');
const { getMint, getAssociatedTokenAddress, createMintToCheckedInstruction, createTransferCheckedInstruction, getOrCreateAssociatedTokenAccount } = require('@solana/spl-token')
const id = require('../id.json')
const app = express();

app.use(cors())
app.use(express.json());

const keypair = Keypair.fromSecretKey(
  Uint8Array.from(id)
);
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const mint = new PublicKey("4YgT6u6dCmdwYhvWK5bUCvU57uFJjxjLpffE9UVy48xK");

app.post('/', async (req, res) => {
  const { address } = req.body
  if(!address) {
    return res.status(400).send({
      status: 'error',
      text: 'Missing address'
    })
  }
  try{
    const mintHash = await generateToken()
    const transferHash = await sendTokenMinted(address)
    res.send({
      status: 'success',
      mint: mintHash,
      transfer: transferHash
    })
  } catch {
    res.status(500).send({
      status: 'error',
      text: 'Something went wrong'
    })
  }
})

async function generateToken() {
  const tokenAccount = await getAssociatedTokenAddress(mint, keypair.publicKey);
  let tx = new Transaction().add(
    createMintToCheckedInstruction(
      mint,
      tokenAccount,
      keypair.publicKey,
      1e9,
      9
    )
  );
  return connection.sendTransaction(tx, [keypair])
}

async function sendTokenMinted(address) {
  const toPublicKey = new PublicKey(address);
  const fromTokenAccount = await getAssociatedTokenAddress(mint, keypair.publicKey);
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromTokenAccount, mint, toPublicKey);
  let tx = new Transaction().add(
    createTransferCheckedInstruction(
      fromTokenAccount,
      mint, 
      toTokenAccount.address,
      keypair.publicKey,
      1e9, 
      9 
    )
  );
  return connection.sendTransaction(tx, [keypair])
}

app.listen(4070, () => console.log('Server started !'))