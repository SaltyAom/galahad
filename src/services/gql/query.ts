export interface GetFavoriteHentaisVariable {
  id: number[]
}

export interface GetFavoriteHentais {
  nhql: {
    multiple: {
      success: boolean
      data: FavoriteHentaisRequest[]
    }
  }
}

export interface FavoriteHentaisRequest {
  success: boolean
  data: FavoriteHentaiData | null
}

export interface FavoriteHentaiData {
  success: boolean
  data: {
    id: number
    title: {
      display: string
    }
    images: {
      cover: {
        link: string
        info: {
          width: number
          height: number
        }
      }
    }
    info: {
      amount: string
      favorite: string
    }
    metadata: {
      language: string
    }
  }
}

export const getFavoriteHentais = `query GetFavoriteHentais($id: [Int!]!) {
  nhql {
    multiple(id: $id) {
      success
        data {
          success
          data {
            id
            title {
              display
            }
            images {
              cover {
                link
                info {
                  width
                  height
                }
              }
            }
            info {
              amount
              favorite
            }
            metadata {
              language
            }
          }
        }
      }
    }
  }`
