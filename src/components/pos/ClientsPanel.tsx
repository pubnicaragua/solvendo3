import React, { useState, useEffect } from 'react'
import { User, Search, Plus } from 'lucide-react'
import { usePOS } from '../../contexts/POSContext'
import toast from 'react-hot-toast'

interface Props {
  onClientSelected: () => void
}

export default function ClientsPanel({ onClientSelected }: Props) {
  const {
    clientes, loadClientes,
    currentCliente, selectClient,
    crearCliente
  } = usePOS()

  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    tipo: 'Persona',
    extranjero: 'No',
    rut: '',
    razon_social: '',
    giro: '',
    nombres: '',
    apellidos: '',
    direccion: '',
    comuna: '',
    ciudad: ''
  })

  useEffect(() => { loadClientes() }, [loadClientes])

  const filtered = clientes.filter(c =>
    c.razon_social.toLowerCase().includes(search.toLowerCase())
  )

  const pick = (c:any) => {
    selectClient(c)
    onClientSelected()
  }

  const save = async () => {
    if (!form.razon_social.trim() || !form.rut.trim()) {
      return toast.error('RUT y Razón social obligatorios')
    }
    setLoading(true)
    const res = await crearCliente({
      tipo_cliente: form.tipo,
      cliente_extranjero: form.extranjero==='Sí',
      rut: form.rut,
      razon_social: form.razon_social,
      giro: form.giro,
      nombres: form.nombres,
      apellidos: form.apellidos,
      direccion: form.direccion,
      comuna: form.comuna,
      ciudad: form.ciudad
    })
    setLoading(false)
    if (res.success && res.cliente) {
      selectClient(res.cliente)
      onClientSelected()
    }
  }

  // Modo creación
  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-blue-600 font-semibold text-lg">Registrar nuevo cliente</h3>
        </div>
        {/* Formulario fila a fila */}
        {[
          ['Tipo de Cliente', <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} className="border rounded px-3 py-2"><option>Persona</option><option>Empresa</option></select>],
          ['Cliente Extranjero', <select value={form.extranjero} onChange={e=>setForm(f=>({...f,extranjero:e.target.value}))} className="border rounded px-3 py-2"><option>No</option><option>Sí</option></select>],
          ['RUT', <input value={form.rut} onChange={e=>setForm(f=>({...f,rut:e.target.value}))} placeholder="RUT" className="border rounded px-3 py-2" />],
          ['Razón Social', <input value={form.razon_social} onChange={e=>setForm(f=>({...f,razon_social:e.target.value}))} placeholder="Razón Social" className="border rounded px-3 py-2" />],
          ['Giro', <input value={form.giro} onChange={e=>setForm(f=>({...f,giro:e.target.value}))} placeholder="Giro" className="border rounded px-3 py-2" />],
          ['Nombres', <input value={form.nombres} onChange={e=>setForm(f=>({...f,nombres:e.target.value}))} placeholder="Nombres" className="border rounded px-3 py-2" />],
          ['Apellidos', <input value={form.apellidos} onChange={e=>setForm(f=>({...f,apellidos:e.target.value}))} placeholder="Apellidos" className="border rounded px-3 py-2" />],
          ['Dirección', <input value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))} placeholder="Dirección" className="border rounded px-3 py-2" />],
          ['Comuna', <input value={form.comuna} onChange={e=>setForm(f=>({...f,comuna:e.target.value}))} placeholder="Comuna" className="border rounded px-3 py-2" />],
          ['Ciudad', <input value={form.ciudad} onChange={e=>setForm(f=>({...f,ciudad:e.target.value}))} placeholder="Ciudad" className="border rounded px-3 py-2" />],
        ].map(([label, field], i) => (
          <div key={i} className="flex items-center justify-between">
            <label className="font-medium">{label}</label>
            <div className="flex-1 ml-4">{field}</div>
          </div>
        ))}
        <div className="flex space-x-4 pt-4">
          <button onClick={()=>setIsCreating(false)} className="flex-1 py-3 bg-gray-100 rounded-lg">Cancelar</button>
          <button onClick={save} disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </div>
      </div>
    )
  }

  // Modo listado
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="text-blue-600 font-semibold text-lg">Clientes</h3>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {filtered.map(c => (
          <li key={c.id}
            onClick={()=>pick(c)}
            className="p-3 bg-white border rounded hover:bg-gray-50 cursor-pointer flex justify-between"
          >
            <span>{c.razon_social} — {c.rut}</span>
            <Plus className="w-4 h-4 text-blue-600" />
          </li>
        ))}
        {!filtered.length && (
          <li className="text-gray-500 text-center py-4">
            {search ? 'Sin resultados' : 'Aquí aparecerán tus clientes'}
          </li>
        )}
      </ul>
      <button
        onClick={()=>setIsCreating(true)}
        className="w-full py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Registrar nuevo cliente</span>
      </button>
    </div>
  )
}
