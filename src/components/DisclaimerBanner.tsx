import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <p className="text-xs text-amber-800 flex-1">
        <strong>Avertissement :</strong> Ce logiciel est un outil d'assistance à la rédaction.
        Tout document généré doit être relu et validé par un professionnel du droit avant utilisation.
      </p>
      <button onClick={() => setVisible(false)} className="text-amber-600 hover:text-amber-800">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
