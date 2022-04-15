import S from 'fluent-json-schema'

const username = S.string().required().minLength(3).maxLength(32)
const password = S.string().required().minLength(8).maxLength(96)
const email = S.string().required().maxLength(255).format('email')

export const signUpSchema = S.object()
    .prop('email', email)
    .prop('username', username)
    .prop('password', password)

export const signInSchema = S.object()
    .prop('username', username)
    .prop('password', password)

export const changePasswordSchema = S.object()
    .prop('password', password)
    .prop('newPassword', password)
