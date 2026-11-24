import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { NodeData, LinkData } from '../types';
import { attributeOwnerOptions } from '../utils/dslEditing';
import { newParticipant, type ModalState, type ParticipantDraft } from '../hooks/useModalState';
import { useLanguage } from '../i18n/language';

// Una relación tiene al menos dos participantes (binaria); con más es n-aria (§3.11 I).
const MIN_PARTICIPANTS = 2;

interface ModalPropertiesProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NodeData[];
  /** Para mostrar de quién cuelga cada atributo en «Pertenece a» (componentes de compuestos). */
  links: LinkData[];
  modalState: ModalState;
  /** Edición bloqueada: el DSL tiene errores y los índices de línea no son fiables. */
  isEditBlocked: boolean;
  setters: {
    setElementType: (v: string) => void;
    setElementName: (v: string) => void;
    setElementType2: (v: string) => void;
    setAttrIsUnique: (v: boolean) => void;
    setSelectedEntity: (v: string) => void;
    setParticipants: (v: ParticipantDraft[]) => void;
    setSpecType: (v: string) => void;
    setSpecSuperclass: (v: string) => void;
    setSpecSubclasses: (v: string[]) => void;
    setSpecDefiningAttribute: (v: string) => void;
    setSpecIsTotal: (v: boolean) => void;
    setUnionName: (v: string) => void;
    setUnionSuperclasses: (v: string[]) => void;
    setUnionCategory: (v: string) => void;
  };
  onConfirm: () => void;
  /** "Añadir y crear otro": solo para atributos en modo creación. */
  onConfirmAndContinue: () => void;
}

const ENTITY_TYPES = ['entity', 'weak_entity'];
const RELATIONSHIP_TYPES = ['relationship', 'ident_rel'];
const ATTRIBUTE_TOOL_TYPES = ['attribute', 'key_attr', 'derived_attr', 'multivalued_attr'];

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-transparent';
const checkboxClass = 'w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500';

/**
 * Modal para crear o editar elementos (entidades, relaciones, atributos, especializaciones y uniones).
 *
 * En modo edición (`editingNodeId` no nulo) se precarga con los datos del nodo y el botón
 * principal guarda los cambios en el DSL en lugar de añadir un elemento nuevo.
 */
export function ModalProperties({
  isOpen,
  onClose,
  nodes,
  links,
  modalState: state,
  isEditBlocked,
  setters,
  onConfirm,
  onConfirmAndContinue,
}: ModalPropertiesProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const type = state.elementType || '';
  const isEditing = state.editingNodeId !== null;
  const isEntity = ENTITY_TYPES.includes(type);
  const isRelationship = RELATIONSHIP_TYPES.includes(type);
  const isAttribute = ATTRIBUTE_TOOL_TYPES.includes(type);
  const hasNameField = isEntity || isRelationship || isAttribute;

  const byLabel = (a: NodeData, b: NodeData) => a.label.localeCompare(b.label);
  const entities = nodes.filter(n => ENTITY_TYPES.includes(n.type)).sort(byLabel);
  const relationships = nodes
    .filter(n => n.type === 'relationship' || n.type === 'identifying_relationship')
    .sort(byLabel);
  // Un atributo también puede ser propietario: el nuevo será su componente (atributo compuesto).
  const attributeOwners = isAttribute ? attributeOwnerOptions(nodes, links, state.editingNodeId ?? undefined) : [];

  const title = isEntity ? t('modalProperties.title.entity')
    : isRelationship ? t('modalProperties.title.relationship')
    : type === 'specialization' ? t('modalProperties.title.specialization')
    : type === 'union' ? t('modalProperties.title.union')
    : t('modalProperties.title.attribute');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border border-indigo-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            {title}
            {isEditing && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                {t('modalProperties.editing')}
              </span>
            )}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {isEditBlocked && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{t('modalProperties.editBlocked')}</span>
          </div>
        )}

        <div className="space-y-4">
          {hasNameField && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isEntity ? t('modalProperties.name.entity') :
                 isRelationship ? t('modalProperties.name.relationship') :
                 t('modalProperties.name.attribute')}
              </label>
              <input
                type="text"
                autoFocus
                value={state.elementName}
                onChange={(e) => setters.setElementName(e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfirm();
                }}
                className={inputClass}
                placeholder={isEntity ? t('modalProperties.placeholder.entity') :
                            isRelationship ? t('modalProperties.placeholder.relationship') :
                            t('modalProperties.placeholder.attribute')}
              />
            </div>
          )}

          {isEntity && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={type === 'weak_entity'}
                onChange={(e) => setters.setElementType(e.target.checked ? 'weak_entity' : 'entity')}
                className={checkboxClass}
              />
              {t('modalProperties.isWeak')}
            </label>
          )}

          {isRelationship && (
            <>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={type === 'ident_rel'}
                  onChange={(e) => setters.setElementType(e.target.checked ? 'ident_rel' : 'relationship')}
                  className={checkboxClass}
                />
                {t('modalProperties.isIdentifying')}
              </label>

              {state.participants.map((participant, index) => (
                <RelationshipEndFields
                  key={index}
                  heading={t('modalProperties.participant', { n: index + 1 })}
                  entities={entities}
                  participant={participant}
                  onChange={next =>
                    setters.setParticipants(state.participants.map((p, i) => (i === index ? next : p)))
                  }
                  onRemove={
                    state.participants.length > MIN_PARTICIPANTS
                      ? () => setters.setParticipants(state.participants.filter((_p, i) => i !== index))
                      : undefined
                  }
                />
              ))}
              <button
                type="button"
                onClick={() => setters.setParticipants([...state.participants, newParticipant()])}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" /> {t('modalProperties.addParticipant')}
              </button>
            </>
          )}

          {isAttribute && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.attrType')}</label>
                <select
                  value={state.elementType2}
                  onChange={(e) => setters.setElementType2(e.target.value)}
                  className={inputClass}
                >
                  <option value="simple">{t('modalProperties.attrType.simple')}</option>
                  <option value="key">{t('modalProperties.attrType.key')}</option>
                  <option value="partial_key">{t('modalProperties.attrType.partialKey')}</option>
                  <option value="derived">{t('modalProperties.attrType.derived')}</option>
                  <option value="multivalued">{t('modalProperties.attrType.multivalued')}</option>
                </select>
              </div>

              {state.elementType2 === 'key' && (
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={state.attrIsUnique}
                    onChange={(e) => setters.setAttrIsUnique(e.target.checked)}
                    className={`${checkboxClass} mt-0.5`}
                  />
                  <span>
                    {t('modalProperties.alternateKey')}
                    <span className="block text-[11px] text-slate-500">{t('modalProperties.alternateKeyHint')}</span>
                  </span>
                </label>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.associateEntity')}</label>
                <select
                  value={state.selectedEntity}
                  onChange={(e) => setters.setSelectedEntity(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t('modalProperties.selectEntityPlaceholder')}</option>
                  <optgroup label={t('modalProperties.ownerGroup.entities')}>
                    {entities.map(n => (
                      <option key={n.id} value={n.label}>{n.label}</option>
                    ))}
                  </optgroup>
                  {relationships.length > 0 && (
                    <optgroup label={t('modalProperties.ownerGroup.relationships')}>
                      {relationships.map(n => (
                        <option key={n.id} value={n.label}>{n.label}</option>
                      ))}
                    </optgroup>
                  )}
                  {attributeOwners.length > 0 && (
                    <optgroup label={t('modalProperties.ownerGroup.attributes')}>
                      {attributeOwners.map(option => (
                        // Un nombre repetido no se puede referenciar sin ambigüedad: se muestra desactivado.
                        <option key={option.id} value={option.label} disabled={option.ambiguous}>
                          {option.ownerLabel ? `${option.label} (${option.ownerLabel})` : option.label}
                          {option.ambiguous ? ` — ${t('modalProperties.ownerGroup.ambiguous')}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">{t('modalProperties.ownerHint')}</p>
              </div>
            </>
          )}

          {type === 'specialization' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.specType')}</label>
                <select
                  value={state.specType}
                  onChange={(e) => setters.setSpecType(e.target.value)}
                  className={inputClass}
                >
                  <option value="d">{t('modalProperties.specType.disjoint')}</option>
                  <option value="o">{t('modalProperties.specType.overlapping')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.superclass')}</label>
                <select
                  value={state.specSuperclass}
                  onChange={(e) => setters.setSpecSuperclass(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t('modalProperties.selectSuperclass')}</option>
                  {entities.map(n => (
                    <option key={n.id} value={n.label}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.definingAttribute')}</label>
                <input
                  type="text"
                  value={state.specDefiningAttribute}
                  onChange={(e) => setters.setSpecDefiningAttribute(e.target.value)}
                  className={inputClass}
                  placeholder={t('modalProperties.definingAttributePlaceholder')}
                />
                <p className="mt-1 text-[11px] text-slate-500">{t('modalProperties.definingAttributeHint')}</p>
              </div>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={state.specIsTotal}
                  onChange={(e) => setters.setSpecIsTotal(e.target.checked)}
                  className={`${checkboxClass} mt-0.5`}
                />
                <span>
                  {t('modalProperties.specTotal')}
                  <span className="block text-[11px] text-slate-500">{t('modalProperties.specTotalHint')}</span>
                </span>
              </label>

              <CheckboxList
                label={t('modalProperties.subclasses')}
                options={entities.filter(n => n.label !== state.specSuperclass)}
                selected={state.specSubclasses}
                onChange={setters.setSpecSubclasses}
              />
            </>
          )}

          {type === 'union' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.unionName')}</label>
                <input
                  type="text"
                  value={state.unionName}
                  onChange={(e) => setters.setUnionName(e.target.value)}
                  className={inputClass}
                  placeholder={t('modalProperties.unionNamePlaceholder')}
                />
              </div>

              <CheckboxList
                label={t('modalProperties.superclasses')}
                options={entities}
                selected={state.unionSuperclasses}
                onChange={setters.setUnionSuperclasses}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.category')}</label>
                <select
                  value={state.unionCategory}
                  onChange={(e) => setters.setUnionCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t('modalProperties.selectCategory')}</option>
                  {entities.map(n => (
                    <option key={n.id} value={n.label}>{n.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            {isAttribute && !isEditing && (
              <button
                onClick={onConfirmAndContinue}
                title={t('modalProperties.addAnotherTitle')}
                className="flex-1 px-4 py-2 text-sm font-medium text-indigo-700 border border-indigo-300 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
              >
                {t('modalProperties.addAnother')}
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={isEditBlocked}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEditing ? t('modalProperties.save') : t('modalProperties.add')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RelationshipEndFieldsProps {
  heading: string;
  entities: NodeData[];
  participant: ParticipantDraft;
  onChange: (next: ParticipantDraft) => void;
  /** Ausente cuando no se puede quitar (quedarían menos de dos participantes). */
  onRemove?: () => void;
}

/** Entidad, cardinalidad, participación y rol de un participante de la relación. */
function RelationshipEndFields({ heading, entities, participant, onChange, onRemove }: RelationshipEndFieldsProps) {
  const { t } = useLanguage();
  const { entity, cardinality, customCardinality, isTotal, role } = participant;
  const set = (patch: Partial<ParticipantDraft>) => onChange({ ...participant, ...patch });

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-600 uppercase">{heading}</h3>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title={t('modalProperties.removeParticipant')}
            aria-label={t('modalProperties.removeParticipant')}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.entity')}</label>
          <select value={entity} onChange={(e) => set({ entity: e.target.value })} className={inputClass}>
            <option value="">{t('modalProperties.selectPlaceholder')}</option>
            {entities.map(n => (
              <option key={n.id} value={n.label}>{n.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.cardinality')}</label>
          <select value={cardinality} onChange={(e) => set({ cardinality: e.target.value })} className={inputClass}>
            <option value="1">1</option>
            <option value="N">N</option>
            <option value="M">M</option>
            <option value="custom">{t('modalProperties.custom')}</option>
          </select>
        </div>
        {cardinality === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.customCardinality')}</label>
            <input
              type="text"
              value={customCardinality}
              onChange={(e) => set({ customCardinality: e.target.value })}
              className={inputClass}
              placeholder={t('modalProperties.customCardPlaceholder')}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.role')}</label>
          <input
            type="text"
            value={role}
            onChange={(e) => set({ role: e.target.value })}
            className={inputClass}
            placeholder={t('modalProperties.rolePlaceholder')}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isTotal} onChange={(e) => set({ isTotal: e.target.checked })} className={checkboxClass} />
          {t('modalProperties.totalParticipation')}
        </label>
      </div>
    </div>
  );
}

interface CheckboxListProps {
  label: string;
  options: NodeData[];
  selected: string[];
  onChange: (v: string[]) => void;
}

/** Lista de casillas para elegir varias entidades (subclases o superclases de una unión). */
function CheckboxList({ label, options, selected, onChange }: CheckboxListProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 max-h-48 overflow-y-auto space-y-2">
        {options.map(n => (
          <label key={n.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
            <input
              type="checkbox"
              checked={selected.includes(n.label)}
              onChange={(e) => onChange(e.target.checked ? [...selected, n.label] : selected.filter(s => s !== n.label))}
              className={checkboxClass}
            />
            <span className="text-sm text-slate-700">{n.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
