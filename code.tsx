/** @jsx figma.widget.h */

const { widget } = figma;
const {
  AutoLayout,
  Text,
  Input,
  Rectangle,
  Ellipse,
  SVG,
  useSyncedState,
  usePropertyMenu,
  useEffect,
} = widget;

// ─── Types ───────────────────────────────────────────────────────────────────

interface IssueItem {
  id: string;
  pinNumber: number;
  title: string;
  severity: 'medium' | 'high';
  status: 'open' | 'in-progress' | 'closed';
  description: string;
  createdBy: string;
  pinX?: number;
  pinY?: number;
}

interface Screen {
  id: string;
  screenName: string;
  imageData: string;
  issueItems: IssueItem[];
}

interface Row {
  id: string;
  aplNo: string;
  screenName: string;
  mediumDefect: number;
  highDefect: number;
  uxAuditor: string;
  devName: string;
  noOfScreens: number;
  issues: number;
  isCritical: boolean;
  screens: Screen[];
}

interface SupportLink {
  id: string;
  label: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _uid = 0;
function uid(): string {
  return `id_${++_uid}_${Math.floor(Math.random() * 100000)}`;
}

function makeRow(index: number, userName: string = 'UX Auditor'): Row {
  return {
    id: uid(),
    aplNo: 'APL-' + String(index + 1).padStart(3, '0'),
    screenName: '',
    mediumDefect: 0,
    highDefect: 0,
    uxAuditor: userName,
    devName: '',
    noOfScreens: 0,
    issues: 0,
    isCritical: false,
    screens: [],
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INIT_SERVICE_ROWS: Row[] = [];

const INIT_FRAMEWORK_ROWS: Row[] = [];

const INIT_LINKS: SupportLink[] = [
  { id: 'l1', label: 'Prototype' },
  { id: 'l2', label: 'Figma Canva' },
  { id: 'l3', label: 'Service UI Ticket' },
  { id: 'l4', label: 'Web UI Ticket' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const LOGO_DATA_URL = 'data:image/png;base64,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';

const LOGO_SVG_SRC = '<svg width="160" height="44" xmlns="http://www.w3.org/2000/svg"><image width="160" height="44" href="' + LOGO_DATA_URL + '"/></svg>';

function NasdaqLogo() {
  return <SVG width={160} height={44} src={LOGO_SVG_SRC} />;
}

function StatBox({
  value, label, numColor, bgColor, borderColor,
}: {
  value: number; label: string; numColor: string; bgColor: string; borderColor: string;
}) {
  return (
    <AutoLayout
      direction="vertical"
      padding={10}
      fill={bgColor}
      cornerRadius={6}
      stroke={borderColor}
      strokeWidth={1}
      width={100}
      spacing={2}
    >
      <Text fontSize={30} fontWeight={700} fill={numColor}>{pad2(value)}</Text>
      <Text fontSize={11} fontWeight={500} fill={numColor}>{label}</Text>
    </AutoLayout>
  );
}

function CritBox({
  color, bgColor, label, description, isFlag = false,
}: {
  color: string; bgColor: string; label: string; description: string; isFlag?: boolean;
}) {
  return (
    <AutoLayout
      direction="horizontal"
      width="fill-parent"
      fill={bgColor}
      cornerRadius={4}
      spacing={0}
      padding={0}
      overflow="hidden"
    >
      <Rectangle width={3} height="fill-parent" fill={color} />
      <AutoLayout direction="vertical" spacing={3} padding={{ top: 8, right: 8, bottom: 8, left: 8 }} width="fill-parent">
        <AutoLayout direction="horizontal" spacing={4} verticalAlignItems="center">
          {isFlag && (
            <Text fontSize={9} fill={color}>{">"}</Text>
          )}
          <Text fontSize={11} fontWeight={700} fill="#212121">{label}</Text>
        </AutoLayout>
        <Text fontSize={11} fill="#424242" width="fill-parent">{description}</Text>
      </AutoLayout>
    </AutoLayout>
  );
}

function TabBtn({
  label, count, active, onClick,
}: {
  label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <AutoLayout
      onClick={onClick}
      direction="vertical"
      spacing={0}
      padding={{ horizontal: 16, vertical: 0 }}
    >
      <AutoLayout
        direction="horizontal"
        spacing={8}
        verticalAlignItems="center"
        padding={{ top: 14, bottom: 12 }}
      >
        <Text fontSize={14} fontWeight={active ? 700 : 400} fill={active ? '#00ACC1' : '#9E9E9E'}>
          {label}
        </Text>
        <AutoLayout
          padding={{ horizontal: 7, vertical: 2 }}
          fill={active ? '#00ACC1' : '#E0E0E0'}
          cornerRadius={10}
          horizontalAlignItems="center"
          verticalAlignItems="center"
        >
          <Text fontSize={11} fontWeight={600} fill={active ? '#FFFFFF' : '#757575'}>{count}</Text>
        </AutoLayout>
      </AutoLayout>
      <Rectangle width="fill-parent" height={active ? 2 : 0} fill="#00ACC1" />
    </AutoLayout>
  );
}

function FilterPill({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <AutoLayout
      direction="horizontal"
      padding={{ horizontal: 12, vertical: 6 }}
      fill="#F8F9FA"
      cornerRadius={20}
      stroke="#E0E0E0"
      strokeWidth={1}
      spacing={6}
      verticalAlignItems="center"
    >
      <Ellipse width={8} height={8} fill={color} />
      <Text fontSize={12} fill="#424242">{label}:  {pad2(value)}</Text>
    </AutoLayout>
  );
}

function TableHeader() {
  const cols: Array<{ label: string; w: number }> = [
    { label: 'APL NO', w: 108 },
    { label: 'TASK NAME', w: 160 },
    { label: 'MEDIUM DEFECT', w: 120 },
    { label: 'HIGH DEFECT', w: 120 },
    { label: 'UX (AUDITED BY)', w: 140 },
    { label: 'DEV (UPDATED BY)', w: 148 },
    { label: 'NO. OF SCREENS', w: 110 },
    { label: 'ADD ISSUE', w: 110 },
    { label: 'STATUS', w: 120 },
    { label: 'DELETE', w: 56 },
  ];
  return (
    <AutoLayout
      direction="horizontal"
      width="fill-parent"
      padding={{ horizontal: 16, vertical: 10 }}
      fill="#F5F5F5"
      stroke="#E0E0E0"
      strokeWidth={1}
    >
      {cols.map((c) => (
        <AutoLayout key={c.label} width={c.w} padding={{ horizontal: 4 }}>
          <Text fontSize={10} fontWeight={700} fill="#9E9E9E" letterSpacing={0.6}>{c.label}</Text>
        </AutoLayout>
      ))}
    </AutoLayout>
  );
}

function DefectCell({
  value, color, bgColor, borderColor, onInc, onDec,
}: {
  value: number; color: string; bgColor: string; borderColor: string;
  onInc: () => void; onDec: () => void;
}) {
  return (
    <AutoLayout direction="horizontal" spacing={5} verticalAlignItems="center" width={120} padding={{ horizontal: 4 }}>
      {/* Decrement button */}
      <AutoLayout
        onClick={onDec}
        width={20}
        height={20}
        cornerRadius={10}
        fill={value > 0 ? bgColor : '#F5F5F5'}
        stroke={value > 0 ? borderColor : '#E0E0E0'}
        strokeWidth={1}
        horizontalAlignItems="center"
        verticalAlignItems="center"
      >
        <Text fontSize={14} fontWeight={700} fill={value > 0 ? color : '#BDBDBD'}>{"-"}</Text>
      </AutoLayout>

      {/* Count badge */}
      {value > 0 ? (
        <AutoLayout
          width={24}
          height={24}
          cornerRadius={12}
          fill={color}
          horizontalAlignItems="center"
          verticalAlignItems="center"
        >
          <Text fontSize={11} fontWeight={700} fill="#FFFFFF">{value}</Text>
        </AutoLayout>
      ) : (
        <AutoLayout
          width={24}
          height={24}
          cornerRadius={12}
          fill="#F0F0F0"
          stroke="#E0E0E0"
          strokeWidth={1}
          horizontalAlignItems="center"
          verticalAlignItems="center"
        >
          <Text fontSize={11} fill="#BDBDBD">{"-"}</Text>
        </AutoLayout>
      )}

      {/* Increment button */}
      <AutoLayout
        onClick={onInc}
        width={20}
        height={20}
        cornerRadius={10}
        fill="#F5F5F5"
        stroke="#E0E0E0"
        strokeWidth={1}
        horizontalAlignItems="center"
        verticalAlignItems="center"
      >
        <Text fontSize={13} fontWeight={700} fill="#757575">+</Text>
      </AutoLayout>
    </AutoLayout>
  );
}

function TableRowComp({
  row, index, onUpdate, onDelete, onAddIssues,
}: {
  row: Row;
  index: number;
  onUpdate: (u: Partial<Row>) => void;
  onDelete: () => void;
  onAddIssues: () => Promise<void>;
}) {
  const allScreenIssues = (row.screens || []).reduce((acc: IssueItem[], s) => acc.concat(s.issueItems || []), []);
  const issueCount = allScreenIssues.length;
  const mediumCount = allScreenIssues.filter(i => i.severity === 'medium').length;
  const highCount = allScreenIssues.filter(i => i.severity === 'high').length;
  const screenCount = (row.screens || []).length;
  const closedCount = allScreenIssues.filter(i => i.status === 'closed').length;
  const rowStatus = issueCount === 0 ? 'open'
    : closedCount === issueCount ? 'completed'
    : closedCount > 0 ? 'in-progress'
    : 'open';
  const avatarLetter = row.uxAuditor ? row.uxAuditor.charAt(0).toUpperCase() : 'U';

  return (
    <AutoLayout
      direction="horizontal"
      width="fill-parent"
      padding={{ horizontal: 16, vertical: 10 }}
      stroke="#E8E8E8"
      strokeWidth={1}
      fill={index % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
      verticalAlignItems="center"
    >
      {/* APL NO - editable */}
      <AutoLayout width={108} padding={{ horizontal: 4 }}>
        <AutoLayout
          padding={{ horizontal: 8, vertical: 4 }}
          fill="#E0F7FA"
          cornerRadius={5}
          stroke="#B2EBF2"
          strokeWidth={1}
        >
          <Input
            value={row.aplNo}
            onTextEditEnd={(e) => onUpdate({ aplNo: e.characters })}
            fontSize={12}
            fontWeight={700}
            fill="#00838F"
            width={72}
          />
        </AutoLayout>
      </AutoLayout>

      {/* Screen Name */}
      <AutoLayout width={160} padding={{ horizontal: 4 }} direction="horizontal" spacing={4} verticalAlignItems="center">
        {row.isCritical && (
          <Text fontSize={10} fill="#FF6B35">{">"}</Text>
        )}
        <AutoLayout
          onClick={() => onUpdate({ isCritical: !row.isCritical })}
          width={14}
          height={14}
          cornerRadius={2}
          fill={row.isCritical ? '#FF6B35' : '#F5F5F5'}
          stroke={row.isCritical ? '#FF6B35' : '#E0E0E0'}
          strokeWidth={1}
          horizontalAlignItems="center"
          verticalAlignItems="center"
        >
          {row.isCritical && <Text fontSize={9} fill="#FFFFFF">{"v"}</Text>}
        </AutoLayout>
        <Input
          value={row.screenName}
          onTextEditEnd={(e) => onUpdate({ screenName: e.characters })}
          placeholder="Screen name..."
          fontSize={12}
          fill="#424242"
          width="fill-parent"
        />
      </AutoLayout>

      {/* Medium Defect - read-only, auto-calculated */}
      <AutoLayout width={120} padding={{ horizontal: 4 }} horizontalAlignItems="center" verticalAlignItems="center">
        {mediumCount > 0 ? (
          <AutoLayout
            padding={{ horizontal: 10, vertical: 4 }}
            fill="#FFF8E1"
            stroke="#FFE082"
            strokeWidth={1}
            cornerRadius={12}
            horizontalAlignItems="center"
            verticalAlignItems="center"
          >
            <Text fontSize={12} fontWeight={700} fill="#F5A623">{mediumCount}</Text>
          </AutoLayout>
        ) : (
          <Text fontSize={12} fill="#BDBDBD">—</Text>
        )}
      </AutoLayout>

      {/* High Defect - read-only, auto-calculated */}
      <AutoLayout width={120} padding={{ horizontal: 4 }} horizontalAlignItems="center" verticalAlignItems="center">
        {highCount > 0 ? (
          <AutoLayout
            padding={{ horizontal: 10, vertical: 4 }}
            fill="#FFEBEE"
            stroke="#FFCDD2"
            strokeWidth={1}
            cornerRadius={12}
            horizontalAlignItems="center"
            verticalAlignItems="center"
          >
            <Text fontSize={12} fontWeight={700} fill="#E53935">{highCount}</Text>
          </AutoLayout>
        ) : (
          <Text fontSize={12} fill="#BDBDBD">—</Text>
        )}
      </AutoLayout>

      {/* UX Auditor - auto from figma account */}
      <AutoLayout width={140} padding={{ horizontal: 4 }} direction="horizontal" spacing={6} verticalAlignItems="center">
        <AutoLayout
          width={26}
          height={26}
          cornerRadius={13}
          fill="#00ACC1"
          horizontalAlignItems="center"
          verticalAlignItems="center"
        >
          <Text fontSize={12} fontWeight={700} fill="#FFFFFF">{avatarLetter}</Text>
        </AutoLayout>
        <Text fontSize={12} fill="#424242" width="fill-parent">{row.uxAuditor}</Text>
      </AutoLayout>

      {/* Dev Name */}
      <AutoLayout width={148} padding={{ horizontal: 4 }}>
        <Input
          value={row.devName}
          onTextEditEnd={(e) => onUpdate({ devName: e.characters })}
          placeholder="Developer name..."
          fontSize={12}
          fill="#424242"
          width="fill-parent"
        />
      </AutoLayout>

      {/* No. of Screens - read-only, auto-calculated */}
      <AutoLayout width={110} padding={{ horizontal: 4 }} horizontalAlignItems="center" verticalAlignItems="center">
        {screenCount > 0 ? (
          <AutoLayout
            padding={{ horizontal: 10, vertical: 4 }}
            fill="#E0F7FA"
            stroke="#B2EBF2"
            strokeWidth={1}
            cornerRadius={12}
            horizontalAlignItems="center"
            verticalAlignItems="center"
          >
            <Text fontSize={12} fontWeight={600} fill="#00838F">{screenCount}</Text>
          </AutoLayout>
        ) : (
          <Text fontSize={12} fill="#BDBDBD">—</Text>
        )}
      </AutoLayout>

      {/* Add Issue column */}
      <AutoLayout width={110} padding={{ horizontal: 4 }} horizontalAlignItems="center" verticalAlignItems="center">
        <AutoLayout
          onClick={onAddIssues}
          padding={{ horizontal: 8, vertical: 5 }}
          fill={issueCount > 0 ? '#E0F7FA' : '#F8F9FA'}
          stroke={issueCount > 0 ? '#00ACC1' : '#E0E0E0'}
          strokeWidth={1}
          cornerRadius={4}
          horizontalAlignItems="center"
          verticalAlignItems="center"
        >
          <Text fontSize={10} fontWeight={600} fill={issueCount > 0 ? '#00838F' : '#757575'}>
            {issueCount > 0 ? 'View Issues' : 'Add Issue'}
          </Text>
        </AutoLayout>
      </AutoLayout>

      {/* Status column - auto-calculated */}
      <AutoLayout width={120} padding={{ horizontal: 4 }} horizontalAlignItems="center" verticalAlignItems="center">
        {rowStatus === 'completed' ? (
          <AutoLayout
            padding={{ horizontal: 10, vertical: 4 }}
            fill="#E8F5E9"
            stroke="#A5D6A7"
            strokeWidth={1}
            cornerRadius={12}
            horizontalAlignItems="center"
            verticalAlignItems="center"
            spacing={4}
          >
            <Text fontSize={10} fill="#2E7D32">{"✓"}</Text>
            <Text fontSize={11} fontWeight={700} fill="#2E7D32">Completed</Text>
          </AutoLayout>
        ) : rowStatus === 'in-progress' ? (
          <AutoLayout
            padding={{ horizontal: 10, vertical: 4 }}
            fill="#FFF8E1"
            stroke="#FFE082"
            strokeWidth={1}
            cornerRadius={12}
            horizontalAlignItems="center"
            verticalAlignItems="center"
          >
            <Text fontSize={11} fontWeight={700} fill="#F9A825">In Progress</Text>
          </AutoLayout>
        ) : (
          <AutoLayout
            padding={{ horizontal: 10, vertical: 4 }}
            fill="#F5F5F5"
            stroke="#E0E0E0"
            strokeWidth={1}
            cornerRadius={12}
            horizontalAlignItems="center"
            verticalAlignItems="center"
          >
            <Text fontSize={11} fontWeight={600} fill="#9E9E9E">Open</Text>
          </AutoLayout>
        )}
      </AutoLayout>

      {/* Delete column */}
      <AutoLayout width={56} padding={{ horizontal: 4 }} horizontalAlignItems="center" verticalAlignItems="center">
        <AutoLayout
          onClick={onDelete}
          width={28}
          height={28}
          cornerRadius={14}
          fill="#FFF5F5"
          stroke="#FFCDD2"
          strokeWidth={1}
          horizontalAlignItems="center"
          verticalAlignItems="center"
        >
          <Text fontSize={12} fontWeight={700} fill="#E53935">{"x"}</Text>
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

function Widget() {
  // Global state
  const [projectTitle, setProjectTitle] = useSyncedState('projectTitle', 'UX Audit : Design Review');
  const [projectSubtitle, setProjectSubtitle] = useSyncedState('projectSubtitle', 'Design Review Documentation');

  // Tab state
  const [activeTab, setActiveTab] = useSyncedState<'service' | 'framework'>('activeTab', 'service');

  // Row data
  const [serviceRows, setServiceRows] = useSyncedState<Row[]>('serviceRows', INIT_SERVICE_ROWS);
  const [frameworkRows, setFrameworkRows] = useSyncedState<Row[]>('frameworkRows', INIT_FRAMEWORK_ROWS);

  // GitHub sync
  const GIST_ID = 'a764fa0f1ec5de34433edfac81620203';
  const [githubToken, setGithubToken] = useSyncedState('githubToken', '');

  // Left sidebar state
  const [startDate, setStartDate] = useSyncedState('startDate', 'Jan 01 2025');
  const [endDate, setEndDate] = useSyncedState('endDate', 'Jan 29 2025');
  const [envLink, setEnvLink] = useSyncedState('envLink', '');
  const [credentials, setCredentials] = useSyncedState('credentials', 'user / password');
  const [supportLinks, setSupportLinks] = useSyncedState<SupportLink[]>('supportLinks', INIT_LINKS);

  // Active tab rows
  const rows = activeTab === 'service' ? serviceRows : frameworkRows;
  const setRows = activeTab === 'service' ? setServiceRows : setFrameworkRows;

  // Stats
  const sMedium = serviceRows.reduce((s, r) => s + r.mediumDefect, 0);
  const sHigh = serviceRows.reduce((s, r) => s + r.highDefect, 0);
  const fMedium = frameworkRows.reduce((s, r) => s + r.mediumDefect, 0);
  const fHigh = frameworkRows.reduce((s, r) => s + r.highDefect, 0);
  const curMedium = activeTab === 'service' ? sMedium : fMedium;
  const curHigh = activeTab === 'service' ? sHigh : fHigh;

  // Auto-populate UX Auditor from Figma account on first load
  useEffect(() => {
    const name = figma.currentUser ? figma.currentUser.name : null;
    if (name) {
      const updatedService = serviceRows.map(function(r) { return r.uxAuditor === 'UX Auditor' ? Object.assign({}, r, { uxAuditor: name }) : r; });
      const updatedFramework = frameworkRows.map(function(r) { return r.uxAuditor === 'UX Auditor' ? Object.assign({}, r, { uxAuditor: name }) : r; });
      if (updatedService.some(function(r, i) { return r.uxAuditor !== serviceRows[i].uxAuditor; })) {
        setServiceRows(updatedService);
      }
      if (updatedFramework.some(function(r, i) { return r.uxAuditor !== frameworkRows[i].uxAuditor; })) {
        setFrameworkRows(updatedFramework);
      }
    }
  });

  // Row operations
  function addRow() {
    const idx = rows.length;
    const userName = (figma.currentUser && figma.currentUser.name) ? figma.currentUser.name : 'UX Auditor';
    setRows([...rows, makeRow(idx, userName)]);
  }

  function updateRow(id: string, updates: Partial<Row>) {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  function deleteRow(id: string) {
    const updated = rows.filter((r) => r.id !== id).map((r, i) => ({
      ...r,
      aplNo: `APL-${String(i + 1).padStart(3, '0')}`,
    }));
    setRows(updated);
  }

  function addSupportLink() {
    setSupportLinks([...supportLinks, { id: uid(), label: 'New Link' }]);
  }

  function updateLink(id: string, label: string) {
    setSupportLinks(supportLinks.map((l) => (l.id === id ? { ...l, label } : l)));
  }

  function deleteLink(id: string) {
    setSupportLinks(supportLinks.filter((l) => l.id !== id));
  }

  return (
    <AutoLayout
      direction="vertical"
      width={1440}
      fill="#FFFFFF"
      cornerRadius={10}
      effect={[{
        type: 'drop-shadow',
        color: { r: 0, g: 0, b: 0, a: 0.12 },
        offset: { x: 0, y: 4 },
        blur: 24,
        spread: 0,
        visible: true,
        blendMode: 'normal',
      }]}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <AutoLayout
        direction="horizontal"
        width="fill-parent"
        padding={{ horizontal: 20, vertical: 14 }}
        fill={{
          type: 'gradient-linear',
          gradientHandlePositions: [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 },
            { x: 0, y: 0 },
          ],
          gradientStops: [
            { position: 0, color: { r: 0, g: 0, b: 0, a: 1 } },
            { position: 1, color: { r: 0, g: 0.5647, b: 0.7294, a: 1 } },
          ],
        }}
        spacing={12}
        verticalAlignItems="center"
      >
        {/* Logo + Name */}
        <AutoLayout direction="horizontal" spacing={10} verticalAlignItems="center">
          <NasdaqLogo />
        </AutoLayout>

        <Rectangle width={1} height={36} fill="#FFFFFF" opacity={0.25} />

        {/* Title */}
        <AutoLayout direction="vertical" spacing={2}>
          <Input
            value={projectTitle}
            onTextEditEnd={(e) => setProjectTitle(e.characters)}
            fontSize={16}
            fontWeight={700}
            fill="#FFFFFF"
            width={280}
          />
          <Input
            value={projectSubtitle}
            onTextEditEnd={(e) => setProjectSubtitle(e.characters)}
            fontSize={12}
            fill="#90A4AE"
            width={240}
          />
        </AutoLayout>

        <AutoLayout width="fill-parent" height={1} />

        {/* Create Link button */}
        <AutoLayout
          onClick={() => new Promise<void>((resolve) => {
            figma.showUI(__html__, { width: 560, height: 420, title: 'Share Developer Link' });
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            // Strip imageData to keep URL size manageable
            const stripImages = (rows: Row[]) => rows.map(r => ({
              ...r,
              screens: (r.screens || []).map(s => ({ ...s, imageData: '' })),
            }));
            figma.ui.postMessage({
              type: 'share',
              gistId: GIST_ID,
              githubToken,
              payload: {
                projectTitle,
                projectSubtitle,
                updatedAt: dateStr,
                serviceRows: stripImages(serviceRows),
                frameworkRows: stripImages(frameworkRows),
              },
            });
            figma.ui.onmessage = (msg: any) => {
              if (msg.type === 'close' || msg.type === 'gist-sync-done') resolve();
              if (msg.type === 'save-github-token') { setGithubToken(msg.token || ''); }
            };
          })}
          padding={{ horizontal: 14, vertical: 8 }}
          fill={{ r: 0, g: 0.675, b: 0.757, a: 0.18 }}
          stroke={{ r: 0, g: 0.675, b: 0.757, a: 0.45 }}
          strokeWidth={1}
          cornerRadius={6}
          spacing={6}
          verticalAlignItems="center"
        >
          <Text fontSize={12} fontWeight={600} fill="#80DEEA">{"\uD83D\uDD17"}</Text>
          <Text fontSize={12} fontWeight={600} fill="#80DEEA">Create Link</Text>
        </AutoLayout>

      </AutoLayout>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <AutoLayout direction="horizontal" width="fill-parent">

        {/* ── Left Sidebar ────────────────────────────────────────────────── */}
        <AutoLayout
          direction="vertical"
          width={244}
          padding={{ horizontal: 16, vertical: 20 }}
          fill="#FFFFFF"
          stroke="#E8E8E8"
          strokeWidth={1}
          spacing={20}
        >
          {/* SERVICE DEFECT */}
          <AutoLayout direction="vertical" spacing={8} width="fill-parent">
            <Text fontSize={10} fontWeight={700} fill="#1B3A4B" letterSpacing={1.2}>SERVICE DEFECT</Text>
            <AutoLayout direction="horizontal" spacing={8} width="fill-parent">
              <StatBox value={sMedium} label="Medium" numColor="#F5A623" bgColor="#FFF8E1" borderColor="#FFE082" />
              <StatBox value={sHigh} label="High" numColor="#E53935" bgColor="#FFEBEE" borderColor="#FFCDD2" />
            </AutoLayout>
          </AutoLayout>

          {/* FRAMEWORK DEFECT */}
          <AutoLayout direction="vertical" spacing={8} width="fill-parent">
            <Text fontSize={10} fontWeight={700} fill="#1B3A4B" letterSpacing={1.2}>FRAMEWORK DEFECT</Text>
            <AutoLayout direction="horizontal" spacing={8} width="fill-parent">
              <StatBox value={fMedium} label="Medium" numColor="#9C27B0" bgColor="#F3E5F5" borderColor="#CE93D8" />
              <StatBox value={fHigh} label="High" numColor="#9C27B0" bgColor="#F3E5F5" borderColor="#CE93D8" />
            </AutoLayout>
          </AutoLayout>

          {/* Divider */}
          <Rectangle width="fill-parent" height={1} fill="#EEEEEE" />

          {/* REVIEW DATE */}
          <AutoLayout direction="vertical" spacing={8} width="fill-parent">
            <Text fontSize={10} fontWeight={700} fill="#1B3A4B" letterSpacing={1.2}>REVIEW DATE</Text>
            <AutoLayout direction="horizontal" spacing={6} verticalAlignItems="center" width="fill-parent">
              <Text fontSize={10} fill="#9E9E9E">[D]</Text>
              <Text fontSize={11} fill="#757575" width={60}>Start Date</Text>
              <Input
                value={startDate}
                onTextEditEnd={(e) => setStartDate(e.characters)}
                fontSize={11}
                fontWeight={600}
                fill="#212121"
                width="fill-parent"
              />
            </AutoLayout>
            <AutoLayout direction="horizontal" spacing={6} verticalAlignItems="center" width="fill-parent">
              <Text fontSize={10} fill="#9E9E9E">[D]</Text>
              <Text fontSize={11} fill="#757575" width={60}>End Date</Text>
              <Input
                value={endDate}
                onTextEditEnd={(e) => setEndDate(e.characters)}
                fontSize={11}
                fontWeight={600}
                fill="#212121"
                width="fill-parent"
              />
            </AutoLayout>
          </AutoLayout>

          {/* SERVICE INFORMATION */}
          <AutoLayout direction="vertical" spacing={8} width="fill-parent">
            <Text fontSize={10} fontWeight={700} fill="#1B3A4B" letterSpacing={1.2}>SERVICE INFORMATION</Text>
            <AutoLayout direction="horizontal" spacing={6} verticalAlignItems="center" width="fill-parent">
              <Text fontSize={10} fill="#9E9E9E">URL</Text>
              <Text fontSize={11} fill="#757575" width={54}>Env Link</Text>
              <Input
                value={envLink}
                onTextEditEnd={(e) => setEnvLink(e.characters)}
                placeholder="Add link..."
                fontSize={11}
                fill="#00838F"
                width="fill-parent"
              />
            </AutoLayout>
            <AutoLayout direction="horizontal" spacing={6} verticalAlignItems="center" width="fill-parent">
              <Text fontSize={10} fill="#9E9E9E">KEY</Text>
              <Text fontSize={11} fill="#757575" width={60}>Credentials</Text>
              <Input
                value={credentials}
                onTextEditEnd={(e) => setCredentials(e.characters)}
                fontSize={11}
                fill="#212121"
                width="fill-parent"
              />
            </AutoLayout>
          </AutoLayout>

          {/* Divider */}
          <Rectangle width="fill-parent" height={1} fill="#EEEEEE" />

          {/* CRITICALITY REFERENCE */}
          <AutoLayout direction="vertical" spacing={8} width="fill-parent">
            <Text fontSize={10} fontWeight={700} fill="#1B3A4B" letterSpacing={1.2}>CRITICALITY REFERENCE</Text>
            <CritBox
              color="#F5A623"
              bgColor="#FFF8E1"
              label="Medium:"
              description="Issues that produce a bad user experience, making it hard for users to achieve goals."
            />
            <CritBox
              color="#E53935"
              bgColor="#FFEBEE"
              label="High:"
              description="Issues with high risk of blocking the user in their interaction."
            />
            <CritBox
              color="#9C27B0"
              bgColor="#F3E5F5"
              label="Framework:"
              description="Issues related to framework component behaviour."
            />
          </AutoLayout>

          {/* OTHER CRITICALITY */}
          <AutoLayout direction="vertical" spacing={8} width="fill-parent">
            <Text fontSize={10} fontWeight={700} fill="#1B3A4B" letterSpacing={1.2}>OTHER CRITICALITY</Text>
            <CritBox
              color="#FF6B35"
              bgColor="#FFF3EE"
              label="Critical Screen:"
              description="This flag marks screens that must be addressed first as top priority."
              isFlag
            />
          </AutoLayout>

          {/* Divider */}
          <Rectangle width="fill-parent" height={1} fill="#EEEEEE" />

          {/* SUPPORTING LINKS */}
          <AutoLayout direction="vertical" spacing={8} width="fill-parent">
            <AutoLayout direction="horizontal" verticalAlignItems="center" spacing={6}>
              <Text fontSize={10} fontWeight={700} fill="#1B3A4B" letterSpacing={1.2}>SUPPORTING LINKS</Text>
              <AutoLayout
                onClick={addSupportLink}
                padding={{ horizontal: 6, vertical: 2 }}
                fill="#E0F7FA"
                cornerRadius={4}
              >
                <Text fontSize={10} fill="#00838F">+ Add</Text>
              </AutoLayout>
            </AutoLayout>
            {supportLinks.map((link) => (
              <AutoLayout
                key={link.id}
                direction="horizontal"
                spacing={4}
                verticalAlignItems="center"
                width="fill-parent"
              >
                <AutoLayout
                  padding={{ horizontal: 10, vertical: 5 }}
                  stroke="#E0E0E0"
                  strokeWidth={1}
                  cornerRadius={16}
                  spacing={4}
                  verticalAlignItems="center"
                  width="fill-parent"
                >
                  <Input
                    value={link.label}
                    onTextEditEnd={(e) => updateLink(link.id, e.characters)}
                    fontSize={11}
                    fill="#212121"
                    width="fill-parent"
                  />
                  <Text fontSize={10} fill="#9E9E9E">{"^"}</Text>
                </AutoLayout>
                <AutoLayout
                  onClick={() => deleteLink(link.id)}
                  padding={{ horizontal: 4, vertical: 4 }}
                >
                  <Text fontSize={10} fill="#BDBDBD">{"x"}</Text>
                </AutoLayout>
              </AutoLayout>
            ))}
          </AutoLayout>
        </AutoLayout>

        {/* ── Main Content ────────────────────────────────────────────────── */}
        <AutoLayout direction="vertical" width="fill-parent" fill="#FFFFFF">

          {/* Tabs */}
          <AutoLayout
            direction="horizontal"
            width="fill-parent"
            padding={{ left: 8, right: 8 }}
            stroke="#E8E8E8"
            strokeWidth={1}
            spacing={4}
          >
            <TabBtn
              label="Wireframes Defect"
              count={serviceRows.length}
              active={activeTab === 'service'}
              onClick={() => setActiveTab('service')}
            />
            <TabBtn
              label="Component Defect"
              count={frameworkRows.length}
              active={activeTab === 'framework'}
              onClick={() => setActiveTab('framework')}
            />
          </AutoLayout>

          {/* Filter Bar */}
          <AutoLayout
            direction="horizontal"
            width="fill-parent"
            padding={{ horizontal: 20, vertical: 12 }}
            spacing={8}
            verticalAlignItems="center"
          >
            <FilterPill color="#F5A623" label="Medium" value={curMedium} />
            <FilterPill color="#E53935" label="High" value={curHigh} />
            <AutoLayout width="fill-parent" height={1} />
            <AutoLayout
              onClick={addRow}
              padding={{ horizontal: 18, vertical: 9 }}
              fill="#00ACC1"
              cornerRadius={6}
              spacing={6}
              verticalAlignItems="center"
            >
              <Text fontSize={13} fontWeight={600} fill="#FFFFFF">+ Add Screen</Text>
            </AutoLayout>
          </AutoLayout>

          {/* Table */}
          <AutoLayout direction="vertical" width="fill-parent">
            <TableHeader />

            {rows.map((row, idx) => (
              <TableRowComp
                key={row.id}
                row={row}
                index={idx}
                onUpdate={(u) => updateRow(row.id, u)}
                onDelete={() => deleteRow(row.id)}
                onAddIssues={() => new Promise<void>((resolve) => {
                  figma.showUI(__html__, { width: 1100, height: 750 });
                  figma.ui.onmessage = (msg: any) => {
                    if (msg.type === 'save') {
                      const savedScreens: Screen[] = msg.screens || [];
                      const allIssues = savedScreens.reduce((acc: IssueItem[], s: Screen) => acc.concat(s.issueItems || []), []);
                      const updatedRows = rows.map((r) => {
                        if (r.id === msg.rowId) {
                          return {
                            ...r,
                            screens: savedScreens,
                            noOfScreens: savedScreens.length,
                            mediumDefect: allIssues.filter((i: IssueItem) => i.severity === 'medium').length,
                            highDefect: allIssues.filter((i: IssueItem) => i.severity === 'high').length,
                          };
                        }
                        return r;
                      });
                      setRows(updatedRows);
                      // Auto-sync to gist if token configured
                      if (githubToken) {
                        const stripImages = (rs: Row[]) => rs.map(r => ({
                          ...r, screens: (r.screens || []).map(s => ({ ...s, imageData: '' })),
                        }));
                        const now = new Date();
                        figma.ui.postMessage({
                          type: 'gist-sync',
                          gistId: GIST_ID,
                          githubToken,
                          payload: {
                            projectTitle,
                            projectSubtitle,
                            updatedAt: now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                            serviceRows: activeTab === 'service' ? stripImages(updatedRows) : stripImages(serviceRows),
                            frameworkRows: activeTab === 'framework' ? stripImages(updatedRows) : stripImages(frameworkRows),
                          },
                        });
                      } else {
                        resolve();
                      }
                    } else if (msg.type === 'gist-sync-done' || msg.type === 'close') {
                      resolve();
                    } else if (msg.type === 'save-github-token') {
                      setGithubToken(msg.token || '');
                      resolve();
                    }
                  };
                  figma.ui.postMessage({
                    type: 'init',
                    rowId: row.id,
                    rowName: row.screenName || row.aplNo,
                    screens: row.screens || [],
                    userName: figma.currentUser ? figma.currentUser.name : 'UX Auditor',
                    gistId: GIST_ID,
                    githubToken,
                  });
                })}
              />
            ))}

            {/* Add Row Button */}
            <AutoLayout
              onClick={addRow}
              width="fill-parent"
              padding={{ horizontal: 20, vertical: 12 }}
              fill="#F8F9FA"
              stroke="#E8E8E8"
              strokeWidth={1}
              spacing={6}
              verticalAlignItems="center"
            >
              <Text fontSize={12} fill="#9E9E9E">+ Add Screen</Text>
            </AutoLayout>
          </AutoLayout>
        </AutoLayout>

      </AutoLayout>
    </AutoLayout>
  );
}

widget.register(Widget);
