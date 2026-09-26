import { X, AlertCircle } from 'lucide-react';
import type { NodeData } from '../types';
import type { ModalState } from '../hooks/useModalState';
import { useLanguage } from '../i18n/language';

interface ModalPropertiesProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NodeData[];
  modalState: ModalState;
  /** Edición bloqueada: el DSL tiene errores y los índices de línea no son fiables. */
  isEditBlocked: boolean;
  setters: {
    setElementType: (v: string) => void;
    setElementName: (v: string) => void;
    setElementType2: (v: string) => void;
    setSelectedEntity: (v: string) => void;
    setSelectedEntity1: (v: string) => void;
    setSelectedEntity2: (v: string) => void;
    setCardinalityE1: (v: string) => void;
    setCardinalityE2: (v: string) => void;
    setCustomCard1: (v: string) => void;
    setCustomCard2: (v: string) => void;
    setTotalE1: (v: boolean) => void;
    setTotalE2: (v: boolean) => void;
    setSpecType: (v: string) => void;
    setSpecSuperclass: (v: string) => void;
    setSpecSubclasses: (v: string[]) => void;
    setSpecDefiningAttribute: (v: string) => void;
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

              {state.isNaryRelationship ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  {t('modalProperties.naryNote')}
                </p>
              ) : (
                <>
                  <RelationshipEndFields
                    heading={t('modalProperties.firstEntity')}
                    entities={entities}
                    entity={state.selectedEntity1}
                    cardinality={state.cardinalityE1}
                    customCardinality={state.customCard1}
                    isTotal={state.totalE1}
                    onEntity={setters.setSelectedEntity1}
                    onCardinality={setters.setCardinalityE1}
                    onCustomCardinality={setters.setCustomCard1}
                    onTotal={setters.setTotalE1}
                  />
                  <RelationshipEndFields
                    heading={t('modalProperties.secondEntity')}
                    entities={entities}
                    entity={state.selectedEntity2}
                    cardinality={state.cardinalityE2}
                    customCardinality={state.customCard2}
                    isTotal={state.totalE2}
                    onEntity={setters.setSelectedEntity2}
                    onCardinality={setters.setCardinalityE2}
                    onCustomCardinality={setters.setCustomCard2}
                    onTotal={setters.setTotalE2}
                  />
                </>
              )}
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
                  <option value="derived">{t('modalProperties.attrType.derived')}</option>
                  <option value="multivalued">{t('modalProperties.attrType.multivalued')}</option>
                </select>
              </div>

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
                </select>
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
  entity: string;
  cardinality: string;
  customCardinality: string;
  isTotal: boolean;
  onEntity: (v: string) => void;
  onCardinality: (v: string) => void;
  onCustomCardinality: (v: string) => void;
  onTotal: (v: boolean) => void;
}

/** Entidad, cardinalidad y participación de uno de los dos extremos de una relación binaria. */
function RelationshipEndFields({
  heading,
  entities,
  entity,
  cardinality,
  customCardinality,
  isTotal,
  onEntity,
  onCardinality,
  onCustomCardinality,
  onTotal,
}: RelationshipEndFieldsProps) {
  const { t } = useLanguage();
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <h3 className="text-xs font-bold text-slate-600 uppercase mb-3">{heading}</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.entity')}</label>
          <select value={entity} onChange={(e) => onEntity(e.target.value)} className={inputClass}>
            <option value="">{t('modalProperties.selectPlaceholder')}</option>
            {entities.map(n => (
              <option key={n.id} value={n.label}>{n.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('modalProperties.cardinality')}</label>
          <select value={cardinality} onChange={(e) => onCardinality(e.target.value)} className={inputClass}>
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
              onChange={(e) => onCustomCardinality(e.target.value)}
              className={inputClass}
              placeholder={t('modalProperties.customCardPlaceholder')}
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isTotal} onChange={(e) => onTotal(e.target.checked)} className={checkboxClass} />
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
