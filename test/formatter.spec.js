'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

chai.use(chaiAsPromised);

// var should = chai.should();
chai.should();

describe('Formatter', function () {
  const Formatter = require('../');
  let formatter;
  let baseMicroformatData;
  let clock;

  beforeEach(function () {
    clock = sinon.useFakeTimers(1435674000000);

    formatter = new Formatter({
      permalinkStyle: '/:categories/:year/:month/:title/'
    });
    baseMicroformatData = {
      'type': ['h-entry'],
      'properties': {
        'content': ['hello world'],
        'name': ['awesomeness is awesome'],
        'slug': ['awesomeness-is-awesome'],
        'published': [new Date(1435674841000)]
      }
    };
  });

  afterEach(function () {
    clock.restore();
  });

  describe('format', function () {
    it('should return a fully formatted page on sunny day content', function () {
      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle non-existing title', function () {
      delete baseMicroformatData.properties.name;

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: \'\'\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle non-existing content', function () {
      delete baseMicroformatData.properties.content;

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n'
      );
    });

    it('should handle categories', function () {
      baseMicroformatData.properties.category = ['foo', 'bar'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'tags: foo bar\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle language', function () {
      baseMicroformatData.properties.lang = ['en'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'lang: en\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle additional microformat content', function () {
      baseMicroformatData.properties.foo = ['bar'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'mf-foo:\n' +
        '  - bar\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should ignore urls', function () {
      // TODO: We might want to eventually change this and actually expose the URL to Jekyll as the prefered permalink
      //      But when doing so we should also treat the URL as a unique identifier and make sure to replace any
      //      previous file that might have that same explicit or implied URL.
      //      For now we don't have any such logic and thus we should simply just ignore this property until it can
      //      be handled better.

      baseMicroformatData.properties.url = ['http://example.com/'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle a "like" document', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.content;
      baseMicroformatData.properties.slug = [];
      baseMicroformatData.properties['like-of'] = ['http://example.com/liked/page'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: \'\'\n' +
        'mf-like-of:\n' +
        '  - \'http://example.com/liked/page\'\n' +
        '---\n'
      );
    });

    it('should handle derived, real, categories', function () {
      baseMicroformatData.derived = { category: 'interaction' };

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'category: interaction\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle derived person-tags', function () {
      baseMicroformatData.derived = { personTags: ['http://example.com/'] };

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'persontags:\n' +
        '  - \'http://example.com/\'\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should convert HTML to Markdown', function () {
      baseMicroformatData.properties.content = [{ html: '<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>' }];
      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'Abc\n' +
        '\n' +
        '123\n' +
        '\n' +
        '* Foo\n' +
        '* Bar\n'
      );
    });

    it('should not convert HTML to Markdown if opted out', function () {
      baseMicroformatData.properties.content = [{ html: '<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>' }];

      formatter = new Formatter({ noMarkdown: true });

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        '<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>\n'
      );
    });

    it('should escape HTML if sent as plain text', function () {
      baseMicroformatData.properties.content = ['<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>'];
      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        '&lt;p&gt;Abc&lt;/p&gt;&lt;p&gt;123&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Foo&lt;/li&gt;&lt;li&gt;Bar&lt;/li&gt;&lt;/ul&gt;\n'
      );
    });

    it('should support content.value', function () {
      baseMicroformatData.properties.content = [
        { html: '<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>' },
        { value: '<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>' }
      ];
      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'Abc\n' +
        '\n' +
        '123\n' +
        '\n' +
        '* Foo\n' +
        '* Bar\n' +
        '&lt;p&gt;Abc&lt;/p&gt;&lt;p&gt;123&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Foo&lt;/li&gt;&lt;li&gt;Bar&lt;/li&gt;&lt;/ul&gt;\n'
      );
    });
  });

  describe('_formatSlug', function () {
    beforeEach(function () {
      delete baseMicroformatData.properties.slug;
    });

    it('should base slug on title', function () {
      formatter._formatSlug(baseMicroformatData).should.equal('awesomeness-is-awesome');
    });

    it('should fall back to base slug on content', function () {
      delete baseMicroformatData.properties.name;
      formatter = new Formatter({ contentSlug: true });
      formatter._formatSlug(baseMicroformatData).should.equal('hello-world');
    });

    it('should ignore html-tags when basing slug on content', function () {
      delete baseMicroformatData.properties.name;
      baseMicroformatData.properties.content = [{html: '<h1>Foo</h1> Bar &amp; <strong>Abc</strong>'}];
      formatter = new Formatter({ contentSlug: true });
      // Test twice so that we don't get a non-reusable regexp!
      formatter._formatSlug(baseMicroformatData).should.equal('foo-bar-abc');
      formatter._formatSlug(baseMicroformatData).should.equal('foo-bar-abc');
    });

    it('should ultimately fall back to publish time', function () {
      delete baseMicroformatData.properties.name;
      formatter._formatSlug(baseMicroformatData).should.equal('52441');
    });

    it('should limit length of extracted slug', function () {
      baseMicroformatData.properties.name = ['One Two Three Four Five Six Seven'];
      formatter._formatSlug(baseMicroformatData).should.equal('one-two-three-four-five');

      baseMicroformatData.properties.content = baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.name;
      formatter = new Formatter({ contentSlug: true });
      formatter._formatSlug(baseMicroformatData).should.equal('one-two-three-four-five');
    });

    it('should properly format abbreviations', function () {
      baseMicroformatData.properties.name = ['Another CSS-feature is the FooBar'];
      formatter._formatSlug(baseMicroformatData).should.equal('another-css-feature-is-the-foo-bar');
    });

    it('should properly handle swedish chars', function () {
      baseMicroformatData.properties.name = ['ÖverÄnda på Slottet'];
      formatter._formatSlug(baseMicroformatData).should.equal('over-anda-pa-slottet');
    });

    it('should ensure slug doesnt start or end with a dash', function () {
      delete baseMicroformatData.properties.name;
      baseMicroformatData.properties.content = [',One Two Three Four Five, Six Seven'];
      formatter = new Formatter({ contentSlug: true });
      formatter._formatSlug(baseMicroformatData).should.equal('one-two-three-four-five');
    });
  });

  describe('formatFilename', function () {
    it('should use slug', function () {
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('_posts/2015-06-30-awesomeness-is-awesome.md');
    });

    it('should have a HTML file type if opted out of Markdown', function () {
      formatter = new Formatter({ noMarkdown: true });
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('_posts/2015-06-30-awesomeness-is-awesome.html');
    });

    it('should build with a custom path', function () {
      formatter = new Formatter({ filepath: 'content/notes/:year/:month/:slug.md' });
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('content/notes/2015/06/awesomeness-is-awesome.md');
    });
  });

  describe('formatURL', function () {
    it('should base URL on slug', function () {
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('2015/06/awesomeness-is-awesome/');
    });

    it('should support undefined permalink style', function () {
      formatter = new Formatter();
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('2015/06/30/awesomeness-is-awesome.html');
    });

    it('should return absolute URL when requested', function () {
      formatter = new Formatter('http://example.com/foo/');
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('http://example.com/foo/2015/06/30/awesomeness-is-awesome.html');
    });

    it('should include derived category if any', function () {
      baseMicroformatData.derived = { category: 'interaction' };
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('interaction/2015/06/awesomeness-is-awesome/');
    });
  });

  describe('preFormat', function () {
    it('should add published', function () {
      delete baseMicroformatData.properties.published;
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('properties.published[0]').that.is.an.instanceOf(Date).and.eql(new Date(Date.now() - 15000));
    });

    it('should ensure slug', function () {
      delete baseMicroformatData.properties.slug;
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('properties.slug[0]', 'awesomeness-is-awesome');
    });

    it('should derive social category for replies', function () {
      baseMicroformatData.properties['in-reply-to'] = ['http://example.com/replied/to/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'social');
    });

    it('should derive social category for likes', function () {
      baseMicroformatData.properties['like-of'] = ['http://example.com/liked/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'social');
    });

    it('should derive social category for notes', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.slug;
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'social');
    });

    it('should derive links category for bookmarks', function () {
      baseMicroformatData.properties.bookmark = ['http://example.com/bookmarked/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'links');
    });

    it('should derive links category for alternative bookmark property', function () {
      baseMicroformatData.properties['bookmark-of'] = ['http://example.com/bookmarked/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'links');
    });

    it('should derive links category for reposts', function () {
      baseMicroformatData.properties['repost-of'] = ['http://example.com/reposted/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'links');
    });

    it('should derive links category for title-less bookmarks', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.slug;
      baseMicroformatData.properties.bookmark = ['http://example.com/bookmarked/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'links');
    });

    it('should not derive interaction category for normal post', function () {
      return formatter.preFormat(baseMicroformatData).should.eventually.not.have.deep.property('derived.category');
    });

    it('should not derive interaction category when opted out of', function () {
      formatter = new Formatter({ deriveCategory: false });
      baseMicroformatData.properties['in-reply-to'] = ['http://example.com/replied/to/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.not.have.deep.property('derived.category');
    });

    it('should use result of deriveCategory() method when provided', function () {
      formatter = new Formatter({ deriveCategory: () => 'foo' });
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'foo');
    });

    it('should extract person tags from regular tags', function () {
      baseMicroformatData.properties.category = ['http://example.com/', 'foo', 'http://example.net/'];
      return formatter.preFormat(baseMicroformatData).then(function (result) {
        result.should.have.deep.property('derived.personTags').that.deep.equals([
          'http://example.com/',
          'http://example.net/'
        ]);
        result.should.have.deep.property('properties.category').that.deep.equals(['foo']);
      });
    });

    it('should flag that the data has been preformatted', function () {
      return formatter.preFormat(baseMicroformatData).should.eventually.have.property('preFormatted', true);
    });

    it('should not preformat already preformatted data', function () {
      return formatter.preFormat({ preFormatted: true }).should.eventually.deep.equal({ preFormatted: true });
    });

    it('should add defaults when such are defined', function () {
      formatter = new Formatter({
        defaults: {
          properties: {
            lang: ['en']
          }
        }
      });
      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['en']);
    });

    it('should not add defaults when value already exists', function () {
      formatter = new Formatter({
        defaults: {
          properties: {
            content: ['some default content']
          }
        }
      });
      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.content')
        .that.deep.equals(['hello world']);
    });

    it('should be able to base slug on default publish times', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.published;
      delete baseMicroformatData.properties.slug;

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.slug')
        .that.deep.equals([(51600 - 15) + '']);
    });

    it('should derive english language from content', function () {
      baseMicroformatData.properties.content = ['Another evening at the cottage and Bob was feeling brave. Make some food by himself? Surely, how hard could it be. But as the night went on and the dinner cooked Bob grew ever more desperate. Pepper, salt – all these crazy names of things he had never heard before. It would be a long night for poor Mr Bob.'];

      formatter = new Formatter({
        deriveLanguages: ['eng', 'swe']
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['en']);
    });

    it('should derive swedish language from content', function () {
      baseMicroformatData.properties.content = ['Det var en gång en liten utter som hette Skog. Något ironiskt så för skog var allt annat än det som fanns kvar efter att Skog haft sin framfart i sitt grannskap. Varenda liten plätt var kal som åker. Men Skog var inte ledsen för det. Han hade ju trots allt sig själv.'];

      formatter = new Formatter({
        deriveLanguages: ['eng', 'swe']
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['sv']);
    });

    it('should require opt in for language detection', function () {
      baseMicroformatData.properties.content = ['Det var en gång en liten utter som hette Skog. Något ironiskt så för skog var allt annat än det som fanns kvar efter att Skog haft sin framfart i sitt grannskap. Varenda liten plätt var kal som åker. Men Skog var inte ledsen för det. Han hade ju trots allt sig själv.'];
      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .not.have.deep.property('properties.lang');
    });

    it('should not require a whitelist for language detection', function () {
      baseMicroformatData.properties.content = ['Du hast mich einen käse mit orangen saft gekaufen.'];

      formatter = new Formatter({
        deriveLanguages: true
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['de']);
    });

    it('should handle undetectable language', function () {
      baseMicroformatData.properties.content = ['Nope'];

      formatter = new Formatter({
        deriveLanguages: true
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .not.have.deep.property('properties.lang');
    });

    it('should respect defined language, but convert to ISO 639-1', function () {
      baseMicroformatData.properties.content = ['Det var en gång en liten utter som hette Skog. Något ironiskt så för skog var allt annat än det som fanns kvar efter att Skog haft sin framfart i sitt grannskap. Varenda liten plätt var kal som åker. Men Skog var inte ledsen för det. Han hade ju trots allt sig själv.'];
      baseMicroformatData.properties.lang = ['eng'];

      formatter = new Formatter({
        deriveLanguages: ['eng', 'swe']
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['en']);
    });

    it('should respect unknown languages', function () {
      baseMicroformatData.properties.lang = ['123'];
      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['123']);
    });

    it('should derive english language from HTML content', function () {
      baseMicroformatData.properties.content = [{html: 'Another evening at the cottage and Bob was feeling brave. Make some food by himself? Surely, how hard could it be. But as the night went on and the dinner cooked Bob grew ever more desperate. Pepper, salt – all these crazy names of things he had never heard before. It would be a long night for poor Mr Bob.'}];

      formatter = new Formatter({
        deriveLanguages: ['eng', 'swe']
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['en']);
    });
  });

  describe('_formatFilesSlug', function () {
    it('should handle a regular filename', function () {
      formatter._formatFilesSlug('photo', { filename: 'example.jpg' }).should.equal('example.jpg');
    });

    it('should handle a complex filename', function () {
      formatter._formatFilesSlug('photo', { filename: '123.ExampleIs Very-Cool.jpg' }).should.equal('123.example-is-very-cool.jpg');
    });
  });

  describe('_preFormatFiles', function () {
    it('should format files correctly', function () {
      const bufferFoo = new Buffer('sampledata');

      baseMicroformatData.files = {
        photo: [
          { filename: 'foo.jpg', buffer: bufferFoo },
          { filename: 'bar.png', buffer: new Buffer('sampledata') }
        ]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.property('files')
        .that.is.an('array')
        .of.length(2)
        .that.deep.equals([
          {
            filename: 'media/2015-06-awesomeness-is-awesome/foo.jpg',
            buffer: new Buffer('sampledata')
          },
          {
            filename: 'media/2015-06-awesomeness-is-awesome/bar.png',
            buffer: new Buffer('sampledata')
          }
        ])
        .and.has.deep.property('[0].buffer', bufferFoo);
    });

    it('should format file URL:s correctly', function () {
      baseMicroformatData.files = {
        photo: [{ filename: 'foo.jpg', buffer: new Buffer('sampledata') }],
        video: [{ filename: 'foo.mp4', buffer: new Buffer('sampledata') }],
        audio: [{ filename: 'foo.mp3', buffer: new Buffer('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.property('properties')
        .that.contains.all.keys('photo', 'video', 'audio')
        .and.have.property('video')
        .that.deep.equals(['media/2015-06-awesomeness-is-awesome/foo.mp4']);
    });

    it('should make file URL:s absolute if relativeTo is defined', function () {
      formatter = new Formatter('http://example.com/bar/');

      baseMicroformatData.files = {
        audio: [{ filename: 'foo.mp3', buffer: new Buffer('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.audio')
        .that.deep.equals(['http://example.com/bar/media/2015-06-awesomeness-is-awesome/foo.mp3']);
    });

    it('should honor any pre-existing URL:s', function () {
      baseMicroformatData.properties.audio = ['http://example.com/pre-existing/url'];
      baseMicroformatData.files = {
        audio: [{ filename: 'foo.mp3', buffer: new Buffer('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.audio')
        .that.deep.equals([
          'http://example.com/pre-existing/url',
          'media/2015-06-awesomeness-is-awesome/foo.mp3'
        ]);
    });
  });

  describe('formatAll', function () {
    it('should format everything correctly', function () {
      const photoBuffer = new Buffer('sampledata');

      baseMicroformatData.files = {
        photo: [
          {
            filename: 'bar.png',
            buffer: photoBuffer
          }
        ]
      };

      formatter = new Formatter({
        relativeTo: 'http://example.com/bar/',
        permalinkStyle: '/:categories/:year/:month/:title/'
      });

      return formatter.formatAll(baseMicroformatData, 'http://example.com/bar/')
        .should.eventually
        .have.all.keys('filename', 'url', 'content', 'files', 'raw')
        .that.deep.equals({
          filename: '_posts/2015-06-30-awesomeness-is-awesome.md',
          url: 'http://example.com/bar/2015/06/awesomeness-is-awesome/',
          content: '---\n' +
            'layout: micropubpost\n' +
            'date: \'2015-06-30T14:34:01.000Z\'\n' +
            'title: awesomeness is awesome\n' +
            'slug: awesomeness-is-awesome\n' +
            'mf-photo:\n' +
            '  - \'http://example.com/bar/media/2015-06-awesomeness-is-awesome/bar.png\'\n' +
            '---\n' +
            'hello world\n',
          files: [{
            filename: 'media/2015-06-awesomeness-is-awesome/bar.png',
            buffer: photoBuffer
          }],
          raw: {
            derived: {},
            files: [{
              filename: 'media/2015-06-awesomeness-is-awesome/bar.png',
              buffer: photoBuffer
            }],
            preFormatted: true,
            properties: {
              content: ['hello world'],
              name: ['awesomeness is awesome'],
              photo: ['http://example.com/bar/media/2015-06-awesomeness-is-awesome/bar.png'],
              published: [new Date(1435674841000)],
              slug: ['awesomeness-is-awesome']
            },
            type: ['h-entry']
          }

        });
    });
  });
});
