import gql, { client } from '@saltyaom/gq'

client.config('https://api.hifumin.app/v1/graphql')

export { getFavoriteHentais } from './query'
export type {
    GetFavoriteHentais,
    GetFavoriteHentaisVariable,
    FavoriteHentaisRequest,
    FavoriteHentaiData
} from './query'
export default gql
