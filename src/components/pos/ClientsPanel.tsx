import React, { useState, useEffect, SetStateAction } from "react";
import { User, Search, Plus, Check } from "lucide-react";
import { usePOS } from "../../contexts/POSContext";
import toast from "react-hot-toast";
import SearchBarClientes from "./SearchBarClientes";

interface Props {
  onClientSelected: (cliente: any) => void;
  clientSearchTerm?: string;
  isCreating: boolean;
  setIsCreating: React.Dispatch<SetStateAction<boolean>>
}

export default function ClientsPanel({ onClientSelected, isCreating, setIsCreating }: Props) {
  const { clientes, loadClientes, currentCliente, selectClient, crearCliente } =
    usePOS();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tipo: "Persona",
    extranjero: "No",
    rut: "",
    razon_social: "",
    giro: "",
    nombres: "",
    apellidos: "",
    direccion: "",
    comuna: "",
    ciudad: "",
  });

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const pick = (c: any) => {
    selectClient(c);
    onClientSelected(c);
  };

  const save = async () => {
    if (form.tipo === "Persona") {
      if (!form.nombres.trim() || !form.apellidos.trim() || !form.rut.trim()) {
        return toast.error("RUT, Nombres y Apellidos son obligatorios");
      }
    } else {
      // Empresa
      if (!form.razon_social.trim() || !form.rut.trim()) {
        return toast.error("RUT y Razón social son obligatorios");
      }
    }

    setLoading(true);
    const res = await crearCliente({
      rut: form.rut.trim(),
      razon_social:
        form.tipo === "Persona"
          ? `${form.nombres.trim()} ${form.apellidos.trim()}`
          : form.razon_social.trim(),
      giro: form.giro.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      direccion: form.direccion.trim(),
      comuna: form.comuna.trim(),
      ciudad: form.ciudad.trim(),
    });
    setLoading(false);

    if (res.success && res.data) {
      setIsCreating(false);
      setForm({
        tipo: "Persona",
        extranjero: "No",
        rut: "",
        razon_social: "",
        giro: "",
        nombres: "",
        apellidos: "",
        direccion: "",
        comuna: "",
        ciudad: "",
      });
      selectClient(res.data);
      onClientSelected(res.data);
    } else {
      toast.error("Error al crear cliente");
    }
  };

  // Modo creación
  if (isCreating) {
    // Define los campos del formulario según el tipo de cliente
    const fieldsPersona = [
      [
        "Tipo de Cliente",
        <select
          value={form.tipo}
          onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
          className="border rounded px-3 py-2"
        >
          <option>Persona</option>
          <option>Empresa</option>
        </select>,
      ],
      [
        "Cliente Extranjero",
        <select
          value={form.extranjero}
          onChange={(e) =>
            setForm((f) => ({ ...f, extranjero: e.target.value }))
          }
          className="border rounded px-3 py-2"
        >
          <option>No</option>
          <option>Sí</option>
        </select>,
      ],
      [
        "RUT",
        <input
          value={form.rut}
          onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
          placeholder="RUT"
          className="border rounded px-3 py-2"
        />,
      ],
      [
        "Nombres",
        <input
          value={form.nombres}
          onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))}
          placeholder="Nombres"
          className="border rounded px-3 py-2"
        />,
      ],
      [
        "Apellidos",
        <input
          value={form.apellidos}
          onChange={(e) =>
            setForm((f) => ({ ...f, apellidos: e.target.value }))
          }
          placeholder="Apellidos"
          className="border rounded px-3 py-2"
        />,
      ],
      [
        "Dirección",
        <input
          value={form.direccion}
          onChange={(e) =>
            setForm((f) => ({ ...f, direccion: e.target.value }))
          }
          placeholder="Dirección"
          className="border rounded px-3 py-2"
        />,
      ],
      [
        "Comuna",
        <input
          value={form.comuna}
          onChange={(e) => setForm((f) => ({ ...f, comuna: e.target.value }))}
          placeholder="Comuna"
          className="border rounded px-3 py-2"
        />,
      ],
      [
        "Ciudad",
        <input
          value={form.ciudad}
          onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
          placeholder="Ciudad"
          className="border rounded px-3 py-2"
        />,
      ],
    ];

    const fieldsEmpresa = [
      [
        "Tipo de Cliente",
        <select
          value={form.tipo}
          onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
          className="border rounded px-3 py-2"
        >
          <option>Persona</option>
          <option>Empresa</option>
        </select>,
      ],
      [
        "Cliente Extranjero",
        <select
          value={form.extranjero}
          onChange={(e) =>
            setForm((f) => ({ ...f, extranjero: e.target.value }))
          }
          className="border rounded px-3 py-2"
        >
          <option>No</option>
          <option>Sí</option>
        </select>,
      ],
      [
        "RUT",
        <input
          value={form.rut}
          onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
          placeholder="RUT"
          className="border rounded px-3 py-2"
        />,
      ],
      [
        "Razón Social",
        <input
          value={form.razon_social}
          onChange={(e) =>
            setForm((f) => ({ ...f, razon_social: e.target.value }))
          }
          placeholder="Razón Social"
          className="border rounded px-3 py-2"
        />,
      ],
      [
        "Giro",
        <input
          value={form.giro}
          onChange={(e) => setForm((f) => ({ ...f, giro: e.target.value }))}
          placeholder="Giro"
          className="border rounded px-3 py-2"
        />,
      ],
      [
        "Dirección",
        <input
          value={form.direccion}
          onChange={(e) =>
            setForm((f) => ({ ...f, direccion: e.target.value }))
          }
          placeholder="Dirección"
          className="border rounded px-3 py-2"
        />,
      ],
      [
        "Comuna",
        <input
          value={form.comuna}
          onChange={(e) => setForm((f) => ({ ...f, comuna: e.target.value }))}
          placeholder="Comuna"
          className="border rounded px-3 py-2"
        />,
      ],
      [
        "Ciudad",
        <input
          value={form.ciudad}
          onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
          placeholder="Ciudad"
          className="border rounded px-3 py-2"
        />,
      ],
    ];

    const fieldsToRender =
      form.tipo === "Empresa" ? fieldsEmpresa : fieldsPersona;

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-blue-600 font-semibold text-lg">
            Registrar nuevo cliente
          </h3>
        </div>
        {/* Formulario fila a fila */}
        {fieldsToRender.map(([label, field], i) => (
          <div key={i} className="flex items-center justify-between">
            <label className="font-medium">{label}</label>
            <div className="flex-1 ml-4">{field}</div>
          </div>
        ))}
        <div className="flex space-x-4 pt-4">
          <button
            onClick={() => setIsCreating(false)}
            className="flex-1 py-3 bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cliente"}
          </button>
        </div>
      </div>
    );
  }

  // Modo listado
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="text-blue-600 font-semibold text-lg">Clientes</h3>
      </div>
      <SearchBarClientes
        pick={pick}
        clientModule={true}
        setIsCreating={setIsCreating}
      />
      <button
        onClick={() => setIsCreating(true)}
        className="w-full py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Registrar nuevo cliente</span>
      </button>
    </div>
  );
}
