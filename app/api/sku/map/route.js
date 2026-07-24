import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getUserToolsAccess } from '@/lib/tools'
import {
  getSkuMappingsForUser,
  upsertSkuMappingForUser,
  deleteSkuMappingForUser,
} from '@/lib/db'

// Per-user SKU→Master mapping CRUD for tools/arshanemi-tools-2 ('pdf-cropper'),
// called only when that app runs with NEXT_PUBLIC_IS_CONNECT=true. Same auth
// contract as ./master/route.js and /api/wallet/deduct — see that file's
// comment for why the tool-access check is here too.
const TOOL_SLUG = 'pdf-cropper'

async function authorize(req) {
  const payload = await getAuthPayload(req)
  if (!payload?.userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const access = await getUserToolsAccess(payload.userId, payload.role)
  if (!access.includes(TOOL_SLUG)) {
    return { error: NextResponse.json({ error: 'access_denied' }, { status: 403 }) }
  }
  return { userId: payload.userId }
}

export async function GET(req) {
  const { userId, error } = await authorize(req)
  if (error) return error
  const skuMappings = await getSkuMappingsForUser(userId)
  return NextResponse.json({ skuMappings })
}

export async function POST(req) {
  const { userId, error } = await authorize(req)
  if (error) return error

  const { sku, masterSku } = await req.json()
  const skuMappings = await upsertSkuMappingForUser(userId, sku, masterSku)
  return NextResponse.json({ skuMappings })
}

export async function DELETE(req) {
  const { userId, error } = await authorize(req)
  if (error) return error

  const { sku } = await req.json()
  const skuMappings = await deleteSkuMappingForUser(userId, sku)
  return NextResponse.json({ skuMappings })
}
