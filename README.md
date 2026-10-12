<!-- ================= IDENTITAS MAHASISWA ================= -->
<section class="identity-card" aria-label="Identitas Mahasiswa">
  <div class="identity-badge">
    <span class="identity-dot"></span>
    Tugas Proyek — KlaimKu
  </div>

  <h1 class="identity-name">SULISTIANI</h1>
  <p class="identity-nim">NIM: 12030124120066</p>

  <div class="identity-grid">
    <div class="identity-item">
      <span class="identity-label">Mata Kuliah</span>
      <span class="identity-value">Pengkodean dan Pemrograman</span>
    </div>
    <div class="identity-item">
      <span class="identity-label">Kelas</span>
      <span class="identity-value">D</span>
    </div>
    <div class="identity-item identity-item-wide">
      <span class="identity-label">Dosen Pengampu</span>
      <span class="identity-value">Dr. Totok Dewayanto, S.E., M.Si., Akt., CA</span>
    </div>
  </div>

  <div class="identity-footer">
    <p>PROGRAM STUDI S1 AKUNTANSI</p>
    <p>FAKULTAS EKONOMIKA DAN BISNIS</p>
    <p class="identity-univ">UNIVERSITAS DIPONEGORO</p>
  </div>
</section>

<!-- ================= ENTITY RELATIONSHIP DIAGRAM ================= -->
<section class="erd-section" aria-label="Entity Relationship Diagram">
  <div class="erd-header">
    <h2 class="erd-title">Entity Relationship Diagram</h2>
    <p class="erd-subtitle">
      Struktur database sistem reimbursement <b>KlaimKu</b> — empat entitas utama dengan relasi one-to-many.
    </p>
  </div>

  <div class="erd-canvas">

    <!-- DEPARTMENTS -->
    <article class="erd-entity erd-entity-dept">
      <header class="erd-entity-head">
        <span class="erd-entity-icon">🏢</span>
        <span class="erd-entity-name">departments</span>
      </header>
      <ul class="erd-entity-body">
        <li><span class="erd-key erd-pk">PK</span> id <em>uuid</em></li>
        <li>name <em>text</em></li>
        <li>code <em>text</em></li>
        <li>created_at <em>timestamptz</em></li>
      </ul>
    </article>

    <!-- EMPLOYEES -->
    <article class="erd-entity erd-entity-emp">
      <header class="erd-entity-head">
        <span class="erd-entity-icon">👤</span>
        <span class="erd-entity-name">employees</span>
      </header>
      <ul class="erd-entity-body">
        <li><span class="erd-key erd-pk">PK</span> id <em>uuid</em></li>
        <li><span class="erd-key erd-fk">FK</span> department_id <em>uuid</em></li>
        <li>full_name <em>text</em></li>
        <li>email <em>text</em></li>
        <li>role <em>text</em></li>
        <li>position <em>text</em></li>
        <li>is_active <em>boolean</em></li>
        <li>created_at <em>timestamptz</em></li>
      </ul>
    </article>

    <!-- CATEGORIES -->
    <article class="erd-entity erd-entity-cat">
      <header class="erd-entity-head">
        <span class="erd-entity-icon">🏷️</span>
        <span class="erd-entity-name">categories</span>
      </header>
      <ul class="erd-entity-body">
        <li><span class="erd-key erd-pk">PK</span> id <em>uuid</em></li>
        <li>name <em>text</em></li>
        <li>limit_amount <em>numeric</em></li>
        <li>description <em>text</em></li>
        <li>created_at <em>timestamptz</em></li>
      </ul>
    </article>

    <!-- REIMBURSEMENTS -->
    <article class="erd-entity erd-entity-reim">
      <header class="erd-entity-head">
        <span class="erd-entity-icon">🧾</span>
        <span class="erd-entity-name">reimbursements</span>
      </header>
      <ul class="erd-entity-body">
        <li><span class="erd-key erd-pk">PK</span> id <em>uuid</em></li>
        <li><span class="erd-key erd-fk">FK</span> employee_id <em>uuid</em></li>
        <li><span class="erd-key erd-fk">FK</span> category_id <em>uuid</em></li>
        <li><span class="erd-key erd-fk">FK</span> approved_by <em>uuid</em></li>
        <li>code <em>text</em></li>
        <li>expense_date <em>date</em></li>
        <li>amount <em>numeric</em></li>
        <li>description <em>text</em></li>
        <li>status <em>text</em></li>
        <li>reject_reason <em>text</em></li>
        <li>approved_at <em>timestamptz</em></li>
        <li>created_at <em>timestamptz</em></li>
      </ul>
    </article>

  </div>

  <div class="erd-legend">
    <span class="erd-legend-item"><b class="erd-pk">PK</b> Primary Key</span>
    <span class="erd-legend-item"><b class="erd-fk">FK</b> Foreign Key</span>
    <span class="erd-legend-item"><b class="erd-rel">1 ─ ∞</b> One to Many</span>
  </div>

  <div class="erd-relations-table">
    <table>
      <thead>
        <tr>
          <th>Relasi</th>
          <th>Kardinalitas</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>departments</code> → <code>employees</code></td>
          <td>1 : N</td>
          <td>Satu departemen memiliki banyak karyawan</td>
        </tr>
        <tr>
          <td><code>employees</code> → <code>reimbursements</code></td>
          <td>1 : N</td>
          <td>Satu karyawan dapat mengajukan banyak reimbursement</td>
        </tr>
        <tr>
          <td><code>categories</code> → <code>reimbursements</code></td>
          <td>1 : N</td>
          <td>Satu kategori dipakai di banyak pengajuan</td>
        </tr>
        <tr>
          <td><code>employees</code> → <code>reimbursements.approved_by</code></td>
          <td>1 : N</td>
          <td>Satu approver menyetujui banyak pengajuan</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
