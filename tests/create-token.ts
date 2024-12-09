import * as anchor from '@coral-xyz/anchor';
import { Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { Program } from "@coral-xyz/anchor";
import { CreateToken } from "../target/types/create_token";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";

describe("create-token", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;
  const program = anchor.workspace.CreateToken as Program<CreateToken>;
  const metadata = [
    {
      name: 'pizzza1bit',
      symbol: 'POB',
      decimal:5,
      uri: 'https://crimson-managing-duck-43.mypinata.cloud/ipfs/bafkreiduwsejbcyljmigo5vp2vz35ts5znjm76st5psrcgdfxgsfezm2nis',
    },
    {
      name: 'kryp2wiz',
      symbol: 'KTW',
      decimal:6,
      uri: 'https://crimson-managing-duck-43.mypinata.cloud/ipfs/bafkreifjttm3sbzu5prfxrmacz52kkbymnoip4dowuti6j4lk42tlpxhly'
    },
    {
      name: 'mumut3k',
      symbol: 'MTK',
      decimal:8,
      uri: 'https://crimson-managing-duck-43.mypinata.cloud/ipfs/bafkreidlywvc6yzjif6yg3ckuww45c4w5igmafyxghesqxpapxs5s3qfra'
    }
  ];
  it("Create an SPL Tokens!", async () => {

    const [mintPizza, mintKryp, mintMumut] = Array.from({ length: 3 }, () => Keypair.generate());

    let lamports = await getMinimumBalanceForRentExemptMint(connection);
    [mintPizza, mintKryp, mintMumut].map( async (m, index) =>
      {
        let transactionSignature = await program.methods
          .createTokenMint(metadata[index].decimal, metadata[index].name, metadata[index].symbol, metadata[index].uri)
          .accounts({
            payer: provider.publicKey,
            mintAccount: m.publicKey,
          })
          .signers([m])
          .rpc();

        console.log('Success!');
        console.log(`   Mint Address: ${m.publicKey}`);
        console.log(`   Transaction Signature: ${transactionSignature}`);
      }
    );
    // create pda associated token account for init mint
    const pizzaAtaA= getAssociatedTokenAddressSync(mintPizza.publicKey, provider.publicKey);
    const krypAtaA= getAssociatedTokenAddressSync(mintKryp.publicKey, provider.publicKey);
    const mumutAtaA= getAssociatedTokenAddressSync(mintMumut.publicKey, provider.publicKey);
    let tx = new Transaction();
    tx.instructions = [
      ...[
        [mintPizza.publicKey, provider.publicKey, pizzaAtaA],
        [mintKryp.publicKey, provider.publicKey, krypAtaA],
        [mintMumut.publicKey, provider.publicKey, mumutAtaA],
      ].flatMap((x) => [
        createInitializeMint2Instruction(x[0], 6, x[1], null),
        createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, x[2], x[1], x[0]),
        createMintToInstruction(x[0], x[2], x[1], 1e9),
      ]),
    ];

  });
});
