import S from 'fluent-json-schema'

export const createCollectionSchema = S.object()
    .prop('title', S.string().required())
    .prop('detail', S.string())
    .prop('public', S.boolean())

export const updateCollectionSchema = S.object()
    .prop('title', S.string())
    .prop('detail', S.string())
    .prop('public', S.boolean())

export const updateHentaiOrderSchema = S.array().items(
    S.object()
        .prop('id', S.number().required())
        .prop('order', S.number().required())
)

export const updateHentaiSchema = S.array().items(S.number())

export const setCollectionByHentaiSchema = S.object()
    .prop('add', S.array().items(S.number()))
    .prop('remove', S.array().items(S.number()))
