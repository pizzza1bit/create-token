import * as anchor from "@coral-xyz/anchor";  
import { Keypair, Transaction } from "@solana/web3.js";  
import { Program } from "@coral-xyz/anchor";  
import { CreateToken } from "../target/types/create_token";  
import {  
  createAssociatedTokenAccountIdempotentInstruction,  
  createMintToInstruction,  
  getAssociatedTokenAddressSync,  
} from "@solana/spl-token";  

describe("create-token", () => {  
  // Configure the client to use the local cluster.  
  anchor.setProvider(anchor.AnchorProvider.env());  
  const provider = anchor.getProvider();  
  const program = anchor.workspace.CreateToken as Program<CreateToken>;  

  const metadata = [  
    {  
      name: "pizzza1bit",  
      symbol: "POB",  
      decimal: 5,  
      uri: "https://crimson-managing-duck-43.mypinata.cloud/ipfs/bafkreiduwsejbcyljmigo5vp2vz35ts5znjm76st5psrcgdfxgsfezm2ni",  
    },  
    {  
      name: "kryp2wiz",  
      symbol: "KTW",  
      decimal: 6,  
      uri: "https://crimson-managing-duck-43.mypinata.cloud/ipfs/bafkreifjttm3sbzu5prfxrmacz52kkbymnoip4dowuti6j4lk42tlpxhly",  
    },  
    {  
      name: "mumut3k",  
      symbol: "MTK",  
      decimal: 8,  
      uri: "https://crimson-managing-duck-43.mypinata.cloud/ipfs/bafkreidlywvc6yzjif6yg3ckuww45c4w5igmafyxghesqxpapxs5s3qfra",  
    },  
  ];  
  const [mintPizza, mintKryp, mintMumut] = Array.from(  
    { length: 3 },  
    () => Keypair.generate()  
  );  

  const log = async (signature: string): Promise<string> => {  
    console.log(  
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}??cluster=devnet`  
    );  
    return signature;  
  };  


  it("Create SPL Tokens!", async () => {  


    for (const [index, m] of [mintPizza, mintKryp, mintMumut].entries()) {  
      const transactionSignature = await program.methods  
        .createTokenMint(  
          metadata[index].decimal,  
          metadata[index].name,  
          metadata[index].symbol,  
          metadata[index].uri  
        )  
        .accounts({  
          payer: provider.publicKey,  
          mintAccount: m.publicKey,  
        })  
        .signers([m])  
        .rpc().then(  
          log  
        );  
    };
  });  
  it("Create PDA & mint!", async () => {

    const pizzaAtaA = getAssociatedTokenAddressSync(  
      mintPizza.publicKey,  
      provider.publicKey  
    );  
    const krypAtaA = getAssociatedTokenAddressSync(  
      mintKryp.publicKey,  
      provider.publicKey  
    );  
    const mumutAtaA = getAssociatedTokenAddressSync(  
      mintMumut.publicKey,  
      provider.publicKey  
    );  

    const tx = new Transaction();  
    tx.instructions = [  
      ...[  
        [mintPizza.publicKey, provider.publicKey, pizzaAtaA],  
        [mintKryp.publicKey, provider.publicKey, krypAtaA],  
        [mintMumut.publicKey, provider.publicKey, mumutAtaA],  
      ].flatMap((x) => [  
        createAssociatedTokenAccountIdempotentInstruction(  
          provider.publicKey,  
          x[2],  
          x[1],  
          x[0]  
        ),  
        createMintToInstruction(x[0], x[2], x[1], 1e9),  
      ]),  
    ];  

    await provider.sendAndConfirm(tx, []).then(  
      log  
    );  
  });  
});