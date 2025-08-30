import React from 'react';
import { AlertTriangle, Package, Monitor, X, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface NotificationsPanelProps {
    notifications: any[];
    onClose: () => void;
    onRefresh: () => void;
}

export function NotificationsPanel({ notifications, onClose, onRefresh }: NotificationsPanelProps) {

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'stock_bajo':
                return <Package className="w-5 h-5 text-orange-500" />;
            case 'inconsistencia_pos':
                return <Monitor className="w-5 h-5 text-red-500" />;
            default:
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        }
    };

    const getPriorityColor = (prioridad: string) => {
        switch (prioridad) {
            case 'alta':
                return 'border-l-red-500 bg-red-50';
            case 'media':
                return 'border-l-yellow-500 bg-yellow-50';
            default:
                return 'border-l-blue-500 bg-blue-50';
        }
    };

    const markAsRead = async (notification: any) => {
        if (!notification) return

        if (notification.tipo === "stock_bajo") return

        const { error } = await supabase
            .from("notificaciones")
            .update({ leida: true })
            .eq("id", notification.id);

        if (error) {
            toast.error("Error al actualizar la notificación")
            return
        }
        onRefresh();
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">
                    Notificaciones {notifications.length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                            {notifications.length}
                        </span>
                    )}
                </h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onRefresh}
                        className="p-1 rounded-md hover:bg-gray-100"
                        title="Actualizar notificaciones"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        No hay notificaciones nuevas
                    </div>
                ) : (
                    <div className="space-y-2 p-2">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-3 rounded-lg border-l-4 ${getPriorityColor(notification.prioridad)} cursor-pointer hover:bg-opacity-80`}
                                onClick={() => markAsRead(notification)}
                            >
                                <div className="flex items-start space-x-3">
                                    {getIcon(notification.tipo)}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm">
                                            {notification.titulo}
                                        </p>
                                        <p className="text-gray-600 text-xs mt-1">
                                            {notification.mensaje}
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            {new Date(notification.created_at).toLocaleString('es-CL')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200">
                    <button
                        onClick={async () => {
                            for (const notification of notifications) {
                                if (notification.tipo === "stock_bajo") return
                                await markAsRead(notification.id);
                            }
                            onRefresh();
                            onClose();
                        }}
                        className="w-full text-sm text-blue-600 hover:text-blue-700"
                    >
                        Marcar todas como leídas
                    </button>
                </div>
            )}
        </div>
    );
}