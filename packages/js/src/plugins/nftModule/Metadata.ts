import { BigNumber, Creator, Pda, toBigNumber } from '@/types';
import { assert, Option, removeEmptyChars } from '@/utils';
import {
  TokenStandard,
  UseMethod,
} from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { JsonMetadata } from '../nftModule';
import { MetadataAccount } from './accounts';
import { findMetadataPda } from './pdas';

export type Metadata<Json extends object = JsonMetadata> = {
  readonly model: 'metadata';

  /** The address of the Metadata account. */
  readonly address: Pda;

  /** The address of the Mint account. */
  readonly mintAddress: PublicKey;

  /**
   * The address of the authority that is allowed
   * to make changes to the Metadata account.
   * */
  readonly updateAuthorityAddress: PublicKey;

  /** The JSON metadata associated with the metadata acount. */
  readonly json: Option<Json>;

  /**
   * Whether or not the JSON metadata was loaded in the first place.
   * When this is `false`, the `json` property is should be ignored.
   * */
  readonly jsonLoaded: boolean;

  /**
   * The on-chain name of the asset, stored in the Metadata account.
   * E.g. "My NFT #123"
   * */
  readonly name: string;

  /**
   * The on-chain symbol of the asset, stored in the Metadata account.
   * E.g. "MYNFT"
   * */
  readonly symbol: string;

  /**
   * The URI that points to the JSON metadata of the asset.
   * This URI is used to load the `json` property of this object.
   * */
  readonly uri: string;

  /**
   * Whether or not the asset is mutable.
   * When set to `false` no one can update the Metadata account,
   * not even the update authority.
   * */
  readonly isMutable: boolean;

  /**
   * Whether or not the asset has already been sold to its first buyer.
   * When set to `false`, all royalties should be paid to the creators.
   * When set to `true`, royalties should be calculate as usual.
   */
  readonly primarySaleHappened: boolean;

  /**
   * The royalties in percent basis point (i.e. 250 is 2.5%) that
   * should be paid to the creators on each secondary sale.
   */
  readonly sellerFeeBasisPoints: number;

  /** Stores the bump of the edition PDA. */
  readonly editionNonce: Option<number>;

  /**
   * The creators of the asset.
   * Each object within the array contains the address,
   * the shares in percent (i.e. 5 is 5%) and whether or not the
   * creator is verified (i.e. they signed the asset).
   * */
  readonly creators: Creator[];

  /**
   * This enum indicates which type of asset we are dealing with.
   * It can be an NFT, a limited edition of an original NFT,
   * a fungible asset (i.e. it has zero decimals)
   * or a fungible token (i.e. it has more than zero decimals).
   */
  readonly tokenStandard: Option<TokenStandard>;

  readonly collection: Option<MetadataParentCollection>;
  readonly collectionDetails: Option<MetadataCollectionDetails>;
  readonly uses: Option<MetadataUses>;
};

type MetadataUses = {
  useMethod: UseMethod;
  remaining: BigNumber;
  total: BigNumber;
};

type MetadataParentCollection = {
  address: PublicKey;
  verified: boolean;
};

type MetadataCollectionDetails = {
  version: 'V1';
  size: BigNumber;
};

export const isMetadata = (value: any): value is Metadata =>
  typeof value === 'object' && value.model === 'metadata';

export function assertMetadata(value: any): asserts value is Metadata {
  assert(isMetadata(value), `Expected Metadata model`);
}
export const toMetadata = (
  account: MetadataAccount,
  json?: Option<JsonMetadata>
): Metadata => ({
  model: 'metadata',
  address: findMetadataPda(account.data.mint),
  mintAddress: account.data.mint,
  updateAuthorityAddress: account.data.updateAuthority,
  json: json ?? null,
  jsonLoaded: json !== undefined,
  name: removeEmptyChars(account.data.data.name),
  symbol: removeEmptyChars(account.data.data.symbol),
  uri: removeEmptyChars(account.data.data.uri),
  isMutable: account.data.isMutable,
  primarySaleHappened: account.data.primarySaleHappened,
  sellerFeeBasisPoints: account.data.data.sellerFeeBasisPoints,
  editionNonce: account.data.editionNonce,
  creators: account.data.data.creators ?? [],
  tokenStandard: account.data.tokenStandard,
  collection: account.data.collection
    ? {
        ...account.data.collection,
        address: account.data.collection.key,
      }
    : null,
  collectionDetails: account.data.collectionDetails
    ? {
        version: account.data.collectionDetails.__kind,
        size: toBigNumber(account.data.collectionDetails.size),
      }
    : null,
  uses: account.data.uses
    ? {
        ...account.data.uses,
        remaining: toBigNumber(account.data.uses.remaining),
        total: toBigNumber(account.data.uses.total),
      }
    : null,
});