import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getUserToolsAccess } from '@/lib/tools'
import {
  getMasterSkusForUser,
  addMasterSkuForUser,
  renameMasterSkuForUser,
  deleteMasterSkuForUser,
} from '@/lib/db'

// Per-user Master SKU CRUD for tools/arshanemi-tools-2 ('pdf-cropper'),
// called only when that app runs with NEXT_PUBLIC_IS_CONNECT=true (see its
// app/api/sku/master/route.js, which proxies here with the user's Bearer
// JWT). Same auth contract as /api/wallet/deduct: a valid token is required,
// and the user must still hold the 'pdf-cropper' grant — a revoked tool
// shouldn't leave its SKU data readable/writable either.
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
  const masterSkus = await getMasterSkusForUser(userId)
  return NextResponse.json({ masterSkus })
}

export async function POST(req) {
  const { userId, error } = await authorize(req)
  if (error) return error

  const { sku, oldSku, newSku } = await req.json()

  if (oldSku && newSku) {
    const masterSkus = await renameMasterSkuForUser(userId, oldSku, newSku)
    return NextResponse.json({ masterSkus })
  }

  const masterSkus = await addMasterSkuForUser(userId, sku)
  return NextResponse.json({ masterSkus })
}

export async function DELETE(req) {
  const { userId, error } = await authorize(req)
  if (error) return error

  const { sku } = await req.json()
  const masterSkus = await deleteMasterSkuForUser(userId, sku)
  return NextResponse.json({ masterSkus })
}
