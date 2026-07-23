# Text Writing Style

When writing any kind of text - message for a user, a prompt for subagent, a doc -
prefer rich markdown structure with diagrams, maps, compact tables, and short
sections.

Don't abuse just one or two formatting options, like giant nested lists or big flat tables.

Good structure helps both humans and AI agents better expose and understand ideas.

Also prefer to use normal, human readable wording, lexicon and phrases. Don't abuse strange inhuman complex phrases.

## Bad example 1

```md
At a high level, the Linux kernel is a **monolithic kernel** (most core services run in kernel space), but it’s highly **modular** (features/drivers can be built as loadable kernel modules).

**Key layers / subsystems**

1. **System call interface**
   - The boundary between user space and kernel space.
   - User programs call into the kernel via syscalls (often through libc wrappers).

2. **Architecture-specific code (`arch/`)**
   - CPU/SoC dependent pieces: boot/entry code, interrupt/trap handling, context switching, low-level memory management details.
   - Provides a common interface so the rest of the kernel can be mostly architecture-neutral.

3. **Process & thread management (scheduler)**
   - Creates/manages tasks, chooses what runs on each CPU, handles context switches.
   - Includes scheduling classes (e.g., CFS for normal tasks, RT classes).

4. **Memory management (MM)**
   - Virtual memory, paging, page cache, allocation (buddy allocator, slab/slub), memory reclaim.
   - Manages per-process address spaces, shared mappings, and kernel memory.

5. **Virtual File System (VFS) + filesystems**
   - VFS provides a common API (`open/read/write/...`) across many filesystem types.
   - Specific filesystems implement that interface (ext4, xfs, btrfs, tmpfs, procfs, sysfs, etc.).

6. **Block layer & storage stack**
   - Abstraction for block devices (SSDs, HDDs, NVMe).
   - I/O scheduling, request queues, device-mapper/RAID layers; connects to filesystem and raw block access.

7. **Networking stack**
   - Sockets API, TCP/IP implementation, routing, firewalling (netfilter), traffic control.
   - Device drivers connect NIC hardware to the network stack.

8. **Device model + drivers**
   - Bus frameworks (PCI, USB, I2C, SPI), device discovery, power management.
   - Drivers expose hardware through standard kernel interfaces (netdev, block, DRM, input, sound, etc.).

9. **Interrupts, timers, and concurrency primitives**
   - Interrupt handling (top halves/bottom halves, softirqs/tasklets/workqueues).
   - Timers, high-resolution timekeeping.
   - Locks/atomics, RCU, per-CPU data structures.

10. **Security & isolation**
   - Unix permissions, capabilities, LSM framework (SELinux/AppArmor), seccomp, namespaces, cgroups, keyrings.

11. **Loadable Kernel Modules**
   - Many drivers and some subsystems can be loaded/unloaded at runtime, extending the monolithic core.

**How it fits together (typical paths)**

- **File read**: app → syscall (`read`) → VFS → filesystem → page cache → block layer (if needed) → storage driver → hardware.
- **Network send**: app → syscall (`send`) → socket layer → TCP/IP → qdisc → NIC driver → hardware.
- **Process scheduling**: timer interrupt → scheduler decides next task → context switch → MMU state updates as needed.
```

## Good example 1

```md
## Linux Kernel Architecture (High Level)

The Linux kernel sits between hardware and user-space applications, managing resources and abstracting hardware complexity.

```

┌─────────────────────────────────────────┐
│           User Space                    │
│  (applications, libraries, shells)      │
└──────────────────┬──────────────────────┘
                   │ System Calls (syscall interface)
┌──────────────────▼──────────────────────┐
│             Kernel Space                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      Process Management         │    │
│  │  (scheduler, signals, IPC)      │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │      Memory Management          │    │
│  │  (VM, paging, slab allocator)   │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │      Virtual File System (VFS)  │    │
│  │  (ext4, btrfs, tmpfs, proc...)  │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │      Network Stack              │    │
│  │  (TCP/IP, sockets, netfilter)   │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │      Device Drivers             │    │
│  │  (block, char, network, USB...) │    │
│  └─────────────────────────────────┘    │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│             Hardware                    │
│  (CPU, RAM, disks, NICs, peripherals)   │
└─────────────────────────────────────────┘

```

---

### Core Subsystems

**1. Process Management**
- Scheduler (CFS — Completely Fair Scheduler) decides which process runs on which CPU core
- Handles process/thread creation (`fork`, `clone`), signals, and IPC (pipes, semaphores, shared memory)

**2. Memory Management**
- Virtual memory: each process gets its own address space via page tables
- Demand paging, copy-on-write (CoW), swap
- Slab/SLUB allocator for efficient kernel object allocation

**3. Virtual File System (VFS)**
- Unified abstraction over all filesystems
- Everything is a file: real files, devices (`/dev`), processes (`/proc`), kernel params (`/sys`)

**4. Network Stack**
- BSD-socket API exposed to user space
- Full TCP/IP, UDP, ICMP stack; netfilter for firewalling (iptables/nftables)

**5. Device Drivers**
- Largest portion of the kernel codebase
- Loadable as kernel modules (`.ko` files) — loaded/unloaded at runtime
- Categories: block (storage), character (serial), network, platform, USB, GPU, etc.

---

### Key Design Properties

| Property         | Detail                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| **Monolithic**       | All subsystems run in the same kernel address space (fast, but a bug can crash the whole kernel) |
| **Modular**          | Drivers and features can be compiled as loadable modules                                         |
| **Preemptible**      | Kernel code can be preempted (with `PREEMPT` config) for lower latency                             |
| **SMP-aware**        | Symmetric multiprocessing — scales across many CPU cores                                         |
| **POSIX-compatible** | Conforms to POSIX standards for portability                                                      |

---

### Privilege Separation

- **Ring 0** (kernel mode): full hardware access — kernel runs here
- **Ring 3** (user mode): restricted — applications run here
- Crossing the boundary happens via **system calls** (`read`, `write`, `mmap`, etc.), which are the controlled API between user space and the kernel

---

### Boot Flow (brief)

```

BIOS/UEFI → Bootloader (GRUB) → decompress vmlinuz → init hardware
→ mount rootfs → start init/systemd (PID 1) → user space

```

This is a monolithic kernel design, contrasted with microkernels (like Minix/L4) where subsystems run as user-space servers — Linux trades some isolation for performance.
```

## Small examples

1. Context: a prompt to subagent with instructions to create a guide on bootstrapping new ts projects. Bad phrasing: "Preserve reproducibility without embedding package versions as durable policy". Good phrasing: "Do not hardcode package versions in the doc".
2. Context: same as above (ask subagent for ts projects guide). Bad phrasing: "Prove every normative profile through executable temporary fixtures". Good phrasing: "Verify that all examples work by running them in a temporary directory".
3. Context: document discusses React vs Svelte and explains why to choose React in particular case. Bad phrasing: "Svelte applicability should be preserved without adopting the proposal by implication". Good phrasing: "Even though we discussed Svelte, we still prefer React for this project".
