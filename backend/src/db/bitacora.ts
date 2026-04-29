import { supabase } from './supabase'

export async function log(
  idUsuario: number,
  username: string,
  accion: string,
  modulo: string,
  ip: string
) {
  await supabase.from('bitacora').insert({ id_usuario: idUsuario, username, accion, modulo, ip })
}
